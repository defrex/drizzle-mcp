import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import type { DrizzleConfig } from "./config.js";
/**
 * Manages database connections and provides query execution capabilities
 * Currently supports SQLite databases via better-sqlite3
 */
export declare class DatabaseManager {
    private db;
    private sqlite;
    private config;
    /**
     * Initialize the database connection using the provided configuration
     * @param config Validated Drizzle configuration
     * @throws Error if database type is unsupported or credentials are missing
     */
    initialize(config: DrizzleConfig): Promise<void>;
    /**
     * Get the initialized Drizzle database instance
     * @returns Drizzle database instance
     * @throws Error if database is not initialized
     */
    getDb(): ReturnType<typeof drizzle>;
    /**
     * Get the raw SQLite database instance
     * @returns Better-sqlite3 database instance
     * @throws Error if database is not initialized
     */
    getSqlite(): Database.Database;
    /**
     * Execute a raw SQL query with optional parameters
     * WARNING: This executes arbitrary SQL - ensure queries are trusted
     * @param query SQL query string
     * @param params Optional query parameters
     * @returns Query results
     */
    executeQuery(query: string, params?: any[]): Promise<any>;
    /**
     * Get list of all tables in the database
     * @returns Array of table information
     */
    getTables(): Promise<any[]>;
    /**
     * Get complete schema information for all tables
     * @returns Array of table schemas with DDL statements
     */
    getSchema(): Promise<any[]>;
    /**
     * Close the database connection and cleanup resources
     */
    close(): void;
}
//# sourceMappingURL=database.d.ts.map