import { z } from "zod";
/**
 * Zod schema for validating Drizzle configuration files
 * Matches the structure expected by drizzle-kit
 */
declare const DrizzleConfigSchema: z.ZodObject<{
    out: z.ZodOptional<z.ZodString>;
    schema: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>>;
    dialect: z.ZodString;
    dbCredentials: z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        host: z.ZodOptional<z.ZodString>;
        port: z.ZodOptional<z.ZodNumber>;
        user: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        database: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$loose>;
/** Type representing a validated Drizzle configuration */
export type DrizzleConfig = z.infer<typeof DrizzleConfigSchema>;
/** Options for configuring the ConfigLoader */
export interface ConfigOptions {
    /** Path to a specific config file */
    configPath?: string;
    /** Working directory for resolving relative paths */
    cwd?: string;
}
/**
 * Handles loading and caching of Drizzle configuration files
 * Supports TypeScript, JavaScript, and ESM config files
 */
export declare class ConfigLoader {
    private cwd;
    private config;
    private configPath;
    /**
     * Create a new ConfigLoader instance
     * @param options Configuration options
     */
    constructor(options?: ConfigOptions);
    /**
     * Load and validate a Drizzle configuration file
     * Results are cached - subsequent calls with the same path return the cached config
     * @param configPath Path to config file (optional, will auto-detect if not provided)
     * @returns Promise resolving to validated Drizzle configuration
     * @throws Error if config file is not found or invalid
     */
    loadConfig(configPath?: string): Promise<DrizzleConfig>;
    private resolveConfigPath;
    /**
     * Get the directory containing the loaded config file
     * @returns Directory path of the config file
     * @throws Error if no config has been loaded
     */
    getConfigDirectory(): string;
    /**
     * Resolve a relative path from the config file's directory
     * @param path Relative path to resolve
     * @returns Absolute path resolved from config directory
     */
    resolvePathFromConfig(path: string): string;
}
export {};
//# sourceMappingURL=config.d.ts.map