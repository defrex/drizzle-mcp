import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { ConfigLoader, type DrizzleConfig } from "./config.js";
import { DatabaseManager } from "./database.js";

const execAsync = promisify(exec);

// Resource URI constants
const RESOURCE_URIS = {
  TABLES: "sqlite://tables",
  SCHEMA: "sqlite://schema",
} as const;

// Input validation helper
function validateMigrationName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new Error("Migration name is required and must be a string");
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error("Migration name can only contain letters, numbers, hyphens, and underscores");
  }
}

/**
 * Model Context Protocol server for Drizzle ORM operations
 * Provides tools for database schema management, migrations, and query execution
 */
export class DrizzleMCPServer {
  private server: Server;
  private configLoader: ConfigLoader;
  private databaseManager: DatabaseManager;
  private config: DrizzleConfig | null = null;

  /**
   * Create a new Drizzle MCP server instance
   * @param cwd Working directory for resolving config files (defaults to process.cwd())
   */
  constructor(cwd?: string) {
    this.configLoader = new ConfigLoader({ cwd });
    this.databaseManager = new DatabaseManager();
    
    this.server = new Server(
      {
        name: "drizzle-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Execute a drizzle-kit command with consistent error handling
   * @param command The drizzle-kit command to execute
   * @param config Optional config path override
   * @returns Promise resolving to command output
   */
  private async executeDrizzleKitCommand(command: string, config?: string): Promise<{ stdout: string; stderr: string }> {
    await this.loadConfig(config);
    const configPath = config || this.getDefaultConfigPath();
    const fullCommand = `npx drizzle-kit ${command} --config=${configPath}`;
    
    return await execAsync(fullCommand, { 
      cwd: this.configLoader.getConfigDirectory() 
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "drizzle_generate_migration",
            description: "Generate a new migration file using drizzle-kit",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name for the migration",
                },
                config: {
                  type: "string",
                  description: "Path to drizzle config file (optional)",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "drizzle_run_migrations",
            description: "Run pending migrations using drizzle-kit",
            inputSchema: {
              type: "object",
              properties: {
                config: {
                  type: "string",
                  description: "Path to drizzle config file (optional)",
                },
              },
            },
          },
          {
            name: "drizzle_introspect_schema",
            description: "Introspect database schema using drizzle-kit",
            inputSchema: {
              type: "object",
              properties: {
                config: {
                  type: "string",
                  description: "Path to drizzle config file (optional)",
                },
              },
            },
          },
          {
            name: "execute_query",
            description: "Execute a raw SQL query on the database",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "SQL query to execute",
                },
                params: {
                  type: "array",
                  description: "Query parameters",
                  items: { type: "string" },
                  default: [],
                },
              },
              required: ["query"],
            },
          },
          {
            name: "initialize_database",
            description: "Initialize database connection",
            inputSchema: {
              type: "object",
              properties: {
                config: {
                  type: "string",
                  description: "Path to drizzle config file (optional)",
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "drizzle_generate_migration":
            return await this.handleGenerateMigration(args);
          case "drizzle_run_migrations":
            return await this.handleRunMigrations(args);
          case "drizzle_introspect_schema":
            return await this.handleIntrospectSchema(args);
          case "execute_query":
            return await this.handleExecuteQuery(args);
          case "initialize_database":
            return await this.handleInitializeDatabase(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: RESOURCE_URIS.TABLES,
            name: "Database Tables",
            description: "List all tables in the database",
            mimeType: "application/json",
          },
          {
            uri: RESOURCE_URIS.SCHEMA,
            name: "Database Schema",
            description: "Complete database schema information",
            mimeType: "application/json",
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (!this.config) {
        await this.loadConfig();
      }

      try {
        switch (uri) {
          case RESOURCE_URIS.TABLES: {
            const tables = await this.databaseManager.getTables();
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(tables, null, 2),
                },
              ],
            };
          }

          case RESOURCE_URIS.SCHEMA: {
            const schema = await this.databaseManager.getSchema();
            return {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(schema, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown resource URI: ${uri}. Available resources: ${Object.values(RESOURCE_URIS).join(", ")}`);
        }
      } catch (error) {
        throw new Error(`Failed to read resource '${uri}': ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Load and initialize the Drizzle configuration
   * @param configPath Optional path to config file (will auto-detect if not provided)
   * @throws Error if config file is invalid or database initialization fails
   */
  async loadConfig(configPath?: string): Promise<void> {
    if (!this.config || configPath) {
      this.config = await this.configLoader.loadConfig(configPath);
      await this.databaseManager.initialize(this.config);
    }
  }

  private async handleGenerateMigration(args: any) {
    const { name: migrationName, config } = args as {
      name: string;
      config?: string;
    };

    validateMigrationName(migrationName);

    const { stdout, stderr } = await this.executeDrizzleKitCommand(`generate --name=${migrationName}`, config);

    return {
      content: [
        {
          type: "text",
          text: `Migration '${migrationName}' generated successfully:\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`,
        },
      ],
    };
  }

  private async handleRunMigrations(args: any) {
    const { config } = args as { config?: string };

    const { stdout, stderr } = await this.executeDrizzleKitCommand("migrate", config);

    return {
      content: [
        {
          type: "text",
          text: `Migrations executed successfully:\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`,
        },
      ],
    };
  }

  private async handleIntrospectSchema(args: any) {
    const { config } = args as { config?: string };

    const { stdout, stderr } = await this.executeDrizzleKitCommand("introspect", config);

    return {
      content: [
        {
          type: "text",
          text: `Schema introspected successfully:\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`,
        },
      ],
    };
  }

  private async handleExecuteQuery(args: any) {
    const { query, params = [] } = args as {
      query: string;
      params?: string[];
    };

    if (!query || typeof query !== "string") {
      throw new Error("Query is required and must be a string");
    }

    if (!this.config) {
      await this.loadConfig();
    }

    const result = await this.databaseManager.executeQuery(query, params);
    
    return {
      content: [
        {
          type: "text",
          text: `Query executed successfully:\n\nResult:\n${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  private async handleInitializeDatabase(args: any) {
    const { config } = args as { config?: string };

    try {
      await this.loadConfig(config);
      
      return {
        content: [
          {
            type: "text",
            text: `Database initialized successfully with config: ${config || "auto-detected"}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getDefaultConfigPath(): string {
    return "drizzle.config.ts";
  }

  /**
   * Start the MCP server with stdio transport
   * @throws Error if server fails to start
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  /**
   * Stop the MCP server and cleanup resources
   */
  async stop(): Promise<void> {
    this.databaseManager.close();
  }
}