import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import type { DrizzleConfig } from "./config.js";

// Dynamic imports for optional database drivers
let Database: typeof import("better-sqlite3").default | null = null;
let postgres: typeof import("postgres").default | null = null;

/**
 * Manages database connections and provides query execution capabilities
 * Supports SQLite (better-sqlite3) and PostgreSQL (postgres-js)
 */
export class DatabaseManager {
  private db: any = null;
  private client: any = null;
  private config: DrizzleConfig | null = null;

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
        Database = (await import("better-sqlite3")).default;
        this.client = new Database(config.dbCredentials.url);
        this.db = drizzleSqlite(this.client);
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
      try {
        postgres = (await import("postgres")).default;
        this.client = postgres(connectionString);
        this.db = drizzlePostgres(this.client);
      } catch (error) {
        throw new Error("postgres is required for PostgreSQL databases. Install it with: npm install postgres");
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
      return await client.unsafe(query, params);
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
      return await client`
        SELECT tablename as name 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `;
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
      return await client`
        SELECT 
          t.tablename as name,
          'CREATE TABLE ' || t.tablename || ' (...);' as sql
        FROM pg_tables t
        WHERE t.schemaname = 'public'
      `;
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
        this.client.end();
      }
      this.client = null;
      this.db = null;
    }
  }
}