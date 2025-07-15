import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgresJs } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePostgresPg } from "drizzle-orm/node-postgres";
// Dynamic imports for optional database drivers
let Database = null;
let postgres = null;
let pg = null;
/**
 * Manages database connections and provides query execution capabilities
 * Supports SQLite (better-sqlite3) and PostgreSQL (postgres-js)
 */
export class DatabaseManager {
    db = null;
    client = null;
    config = null;
    /**
     * Initialize the database connection using the provided configuration
     * @param config Validated Drizzle configuration
     * @throws Error if database type is unsupported or credentials are missing
     */
    async initialize(config) {
        this.config = config;
        if (config.dialect === "sqlite") {
            await this.initializeSQLite(config);
        }
        else if (config.dialect === "postgresql") {
            await this.initializePostgreSQL(config);
        }
        else {
            throw new Error(`Database dialect '${config.dialect}' is not supported. Supported dialects: sqlite, postgresql`);
        }
    }
    async initializeSQLite(config) {
        if (!config.dbCredentials.url) {
            throw new Error("Database URL is required in config.dbCredentials.url for SQLite");
        }
        if (!this.client) {
            try {
                Database = (await import("better-sqlite3")).default;
                this.client = new Database(config.dbCredentials.url);
                this.db = drizzleSqlite(this.client);
            }
            catch (error) {
                throw new Error("better-sqlite3 is required for SQLite databases. Install it with: npm install better-sqlite3");
            }
        }
    }
    async initializePostgreSQL(config) {
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
                const postgresModule = await import("postgres");
                postgres = postgresModule.default;
                this.client = postgres(connectionString);
                this.db = drizzlePostgresJs(this.client);
            }
            catch (postgresError) {
                try {
                    const pgModule = await import("pg");
                    const { Pool } = pgModule;
                    this.client = new Pool({ connectionString });
                    this.db = drizzlePostgresPg(this.client);
                }
                catch (pgError) {
                    throw new Error("Either 'postgres' or 'pg' is required for PostgreSQL databases. Install one with: npm install postgres OR npm install pg");
                }
            }
        }
    }
    /**
     * Get the initialized Drizzle database instance
     * @returns Drizzle database instance
     * @throws Error if database is not initialized
     */
    getDb() {
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
    getClient() {
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
    async executeQuery(query, params = []) {
        const db = this.getDb();
        if (this.config?.dialect === "sqlite") {
            const client = this.getClient();
            if (params.length > 0) {
                return client.prepare(query).all(...params);
            }
            else {
                return client.prepare(query).all();
            }
        }
        else if (this.config?.dialect === "postgresql") {
            const client = this.getClient();
            // Check if it's postgres-js (has unsafe method) or pg (has query method)
            if (client.unsafe) {
                return await client.unsafe(query, params);
            }
            else if (client.query) {
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
    async getTables() {
        if (this.config?.dialect === "sqlite") {
            const client = this.getClient();
            return client.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        }
        else if (this.config?.dialect === "postgresql") {
            const client = this.getClient();
            // Check if it's postgres-js (template literal) or pg (query method)
            if (client.unsafe) {
                return await client `
          SELECT tablename as name 
          FROM pg_tables 
          WHERE schemaname = 'public'
        `;
            }
            else if (client.query) {
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
    async getSchema() {
        if (this.config?.dialect === "sqlite") {
            const client = this.getClient();
            return client.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
        }
        else if (this.config?.dialect === "postgresql") {
            const client = this.getClient();
            // Check if it's postgres-js (template literal) or pg (query method)
            if (client.unsafe) {
                return await client `
          SELECT 
            t.tablename as name,
            'CREATE TABLE ' || t.tablename || ' (...);' as sql
          FROM pg_tables t
          WHERE t.schemaname = 'public'
        `;
            }
            else if (client.query) {
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
    close() {
        if (this.client) {
            if (this.config?.dialect === "sqlite") {
                this.client.close();
            }
            else if (this.config?.dialect === "postgresql") {
                // Both postgres-js and pg have an end() method
                this.client.end();
            }
            this.client = null;
            this.db = null;
        }
    }
}
//# sourceMappingURL=database.js.map