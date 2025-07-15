import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
/**
 * Manages database connections and provides query execution capabilities
 * Currently supports SQLite databases via better-sqlite3
 */
export class DatabaseManager {
    db = null;
    sqlite = null;
    config = null;
    /**
     * Initialize the database connection using the provided configuration
     * @param config Validated Drizzle configuration
     * @throws Error if database type is unsupported or credentials are missing
     */
    async initialize(config) {
        this.config = config;
        if (config.dialect !== "sqlite") {
            throw new Error(`Database dialect '${config.dialect}' is not supported. Currently only 'sqlite' is supported.`);
        }
        if (!config.dbCredentials.url) {
            throw new Error("Database URL is required in config.dbCredentials.url");
        }
        if (!this.sqlite) {
            this.sqlite = new Database(config.dbCredentials.url);
            this.db = drizzle(this.sqlite);
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
     * Get the raw SQLite database instance
     * @returns Better-sqlite3 database instance
     * @throws Error if database is not initialized
     */
    getSqlite() {
        if (!this.sqlite) {
            throw new Error("Database not initialized. Call initialize() first.");
        }
        return this.sqlite;
    }
    /**
     * Execute a raw SQL query with optional parameters
     * WARNING: This executes arbitrary SQL - ensure queries are trusted
     * @param query SQL query string
     * @param params Optional query parameters
     * @returns Query results
     */
    async executeQuery(query, params = []) {
        const sqlite = this.getSqlite();
        if (params.length > 0) {
            return sqlite.prepare(query).all(...params);
        }
        else {
            return sqlite.prepare(query).all();
        }
    }
    /**
     * Get list of all tables in the database
     * @returns Array of table information
     */
    async getTables() {
        const sqlite = this.getSqlite();
        return sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    }
    /**
     * Get complete schema information for all tables
     * @returns Array of table schemas with DDL statements
     */
    async getSchema() {
        const sqlite = this.getSqlite();
        return sqlite.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
    }
    /**
     * Close the database connection and cleanup resources
     */
    close() {
        if (this.sqlite) {
            this.sqlite.close();
            this.sqlite = null;
            this.db = null;
        }
    }
}
//# sourceMappingURL=database.js.map