/**
 * Model Context Protocol server for Drizzle ORM operations
 * Provides tools for database schema management, migrations, and query execution
 */
export declare class DrizzleMCPServer {
    private server;
    private configLoader;
    private databaseManager;
    private config;
    /**
     * Create a new Drizzle MCP server instance
     * @param cwd Working directory for resolving config files (defaults to process.cwd())
     */
    constructor(cwd?: string);
    /**
     * Execute a drizzle-kit command with consistent error handling
     * @param command The drizzle-kit command to execute
     * @param config Optional config path override
     * @returns Promise resolving to command output
     */
    private executeDrizzleKitCommand;
    private setupHandlers;
    /**
     * Load and initialize the Drizzle configuration
     * @param configPath Optional path to config file (will auto-detect if not provided)
     * @throws Error if config file is invalid or database initialization fails
     */
    loadConfig(configPath?: string): Promise<void>;
    private handleGenerateMigration;
    private handleRunMigrations;
    private handleIntrospectSchema;
    private handleExecuteQuery;
    private handleInitializeDatabase;
    private getDefaultConfigPath;
    /**
     * Start the MCP server with stdio transport
     * @throws Error if server fails to start
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server and cleanup resources
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map