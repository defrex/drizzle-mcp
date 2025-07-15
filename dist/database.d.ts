import type { DrizzleConfig } from "./config.js";
/**
 * Manages database connections and provides query execution capabilities
 * Supports SQLite (better-sqlite3) and PostgreSQL (postgres-js)
 */
export declare class DatabaseManager {
    private db;
    private client;
    private config;
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Helper to resolve and import modules from the target project
     */
    private importFromProject;
    /**
     * Initialize the database connection using the provided configuration
     * @param config Validated Drizzle configuration
     * @throws Error if database type is unsupported or credentials are missing
     */
    initialize(config: DrizzleConfig): Promise<void>;
    private initializeSQLite;
    private initializePostgreSQL;
    /**
     * Get the initialized Drizzle database instance
     * @returns Drizzle database instance
     * @throws Error if database is not initialized
     */
    getDb(): any;
    /**
     * Get the raw database client instance
     * @returns Database client instance (SQLite or PostgreSQL)
     * @throws Error if database is not initialized
     */
    getClient(): any;
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