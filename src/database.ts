import { sql } from "drizzle-orm";
import type { DrizzleConfig } from "./config.js";
import { createRequire } from "node:module";
import { resolve } from "node:path";

// Dynamic imports for optional database drivers
let Database: any = null;
let postgres: any = null;
let pg: any = null;

/**
 * Manages database connections and provides query execution capabilities
 * Supports SQLite (better-sqlite3) and PostgreSQL (postgres-js)
 */
export class DatabaseManager {
  private db: any = null;
  private client: any = null;
  private config: DrizzleConfig | null = null;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Helper to resolve and import modules from the target project
   */
  private async importFromProject(moduleName: string): Promise<any> {
    try {
      const require = createRequire(resolve(this.projectRoot, "package.json"));
      const modulePath = require.resolve(moduleName);
      return await import(modulePath);
    } catch (error) {
      throw new Error(`Failed to import ${moduleName} from project root ${this.projectRoot}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initialize the database connection using the provided configuration
   * @param config Validated Drizzle configuration
   * @throws Error if database type is unsupported or credentials are missing
   */
  async initialize(config: DrizzleConfig): Promise<void> {
    this.config = config;
    
    if (config.dialect === "sqlite") {
      await this.initializeSQLite(config);
    } else if (config.dialect === "postgresql") {
      await this.initializePostgreSQL(config);
    } else {
      throw new Error(`Database dialect '${config.dialect}' is not supported. Supported dialects: sqlite, postgresql`);
    }
  }

  private async initializeSQLite(config: DrizzleConfig): Promise<void> {
    if (!config.dbCredentials.url) {
      throw new Error("Database URL is required in config.dbCredentials.url for SQLite");
    }

    if (!this.client) {
      try {
        const sqliteModule = await this.importFromProject("better-sqlite3");
        const { drizzle } = await this.importFromProject("drizzle-orm/better-sqlite3");
        Database = sqliteModule.default;
        this.client = new Database(config.dbCredentials.url);
        this.db = drizzle(this.client);
      } catch (error) {
        throw new Error("better-sqlite3 is required for SQLite databases. Install it with: npm install better-sqlite3");
      }
    }
  }

  private async initializePostgreSQL(config: DrizzleConfig): Promise<void> {
    let connectionString = config.dbCredentials.url;
    
    if (!connectionString) {
      // Build connection string from individual credentials
      const { host, port, user, password, database } = config.dbCredentials;
      if (!host || !user || !database) {
        throw new Error("For PostgreSQL, either provide 'url' or 'host', 'user', and 'database' in config.dbCredentials");
      }
      connectionString = `postgresql://${user}:${password || ''}@${host}:${port || 5432}/${database}`;
    }

    if (!this.client) {
      // Try postgres-js first, then fall back to pg
      try {
        const postgresModule = await this.importFromProject("postgres");
        const { drizzle } = await this.importFromProject("drizzle-orm/postgres-js");
        postgres = postgresModule.default;
        this.client = postgres(connectionString);
        this.db = drizzle(this.client);
      } catch (postgresError) {
        try {
          const pgModule = await this.importFromProject("pg");
          const { drizzle } = await this.importFromProject("drizzle-orm/node-postgres");
          const { Pool } = pgModule;
          this.client = new Pool({ connectionString });
          this.db = drizzle(this.client);
        } catch (pgError) {
          throw new Error(`Either 'postgres' or 'pg' is required for PostgreSQL databases. Install one with: npm install postgres OR npm install pg. Project root: ${this.projectRoot}. PG Error: ${pgError instanceof Error ? pgError.message : String(pgError)}`);
        }
      }
    }
  }

  /**
   * Get the initialized Drizzle database instance
   * @returns Drizzle database instance
   * @throws Error if database is not initialized
   */
  getDb(): any {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  /**
   * Get the raw database client instance
   * @returns Database client instance (SQLite or PostgreSQL)
   * @throws Error if database is not initialized
   */
  getClient(): any {
    if (!this.client) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.client;
  }

  /**
   * Execute a raw SQL query with optional parameters
   * WARNING: This executes arbitrary SQL - ensure queries are trusted
   * @param query SQL query string
   * @param params Optional query parameters
   * @returns Query results
   */
  async executeQuery(query: string, params: any[] = []): Promise<any> {
    const db = this.getDb();
    
    if (this.config?.dialect === "sqlite") {
      const client = this.getClient();
      if (params.length > 0) {
        return client.prepare(query).all(...params);
      } else {
        return client.prepare(query).all();
      }
    } else if (this.config?.dialect === "postgresql") {
      const client = this.getClient();
      
      // Check if it's postgres-js (has unsafe method) or pg (has query method)
      if (client.unsafe) {
        return await client.unsafe(query, params);
      } else if (client.query) {
        const result = await client.query(query, params);
        return result.rows;
      }
      
      throw new Error("Unknown PostgreSQL client type");
    }
    
    throw new Error(`Query execution not implemented for dialect: ${this.config?.dialect}`);
  }

  /**
   * Get list of all tables in the database
   * @returns Array of table information
   */
  async getTables(): Promise<any[]> {
    if (this.config?.dialect === "sqlite") {
      const client = this.getClient();
      return client.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    } else if (this.config?.dialect === "postgresql") {
      const client = this.getClient();
      
      // Check if it's postgres-js (template literal) or pg (query method)
      if (client.unsafe) {
        return await client`
          SELECT tablename as name 
          FROM pg_tables 
          WHERE schemaname = 'public'
        `;
      } else if (client.query) {
        const result = await client.query(`
          SELECT tablename as name 
          FROM pg_tables 
          WHERE schemaname = 'public'
        `);
        return result.rows;
      }
      
      throw new Error("Unknown PostgreSQL client type");
    }
    
    throw new Error(`getTables not implemented for dialect: ${this.config?.dialect}`);
  }

  /**
   * Get complete schema information for all tables
   * @returns Array of table schemas with DDL statements
   */
  async getSchema(): Promise<any[]> {
    if (this.config?.dialect === "sqlite") {
      const client = this.getClient();
      return client.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
    } else if (this.config?.dialect === "postgresql") {
      const client = this.getClient();
      
      // Check if it's postgres-js (template literal) or pg (query method)
      if (client.unsafe) {
        return await client`
          SELECT 
            t.tablename as name,
            'CREATE TABLE ' || t.tablename || ' (...);' as sql
          FROM pg_tables t
          WHERE t.schemaname = 'public'
        `;
      } else if (client.query) {
        const result = await client.query(`
          SELECT 
            t.tablename as name,
            'CREATE TABLE ' || t.tablename || ' (...);' as sql
          FROM pg_tables t
          WHERE t.schemaname = 'public'
        `);
        return result.rows;
      }
      
      throw new Error("Unknown PostgreSQL client type");
    }
    
    throw new Error(`getSchema not implemented for dialect: ${this.config?.dialect}`);
  }

  /**
   * Close the database connection and cleanup resources
   */
  close(): void {
    if (this.client) {
      if (this.config?.dialect === "sqlite") {
        this.client.close();
      } else if (this.config?.dialect === "postgresql") {
        // Both postgres-js and pg have an end() method
        this.client.end();
      }
      this.client = null;
      this.db = null;
    }
  }
}