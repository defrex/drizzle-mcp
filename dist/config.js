import { z } from "zod";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
/**
 * Zod schema for validating Drizzle configuration files
 * Matches the structure expected by drizzle-kit
 */
const DrizzleConfigSchema = z.object({
    out: z.string().optional(),
    schema: z.string().or(z.array(z.string())).optional(),
    dialect: z.string(),
    dbCredentials: z.object({
        url: z.string().optional(),
        host: z.string().optional(),
        port: z.number().optional(),
        user: z.string().optional(),
        password: z.string().optional(),
        database: z.string().optional(),
    }),
}).passthrough();
/**
 * Handles loading and caching of Drizzle configuration files
 * Supports TypeScript, JavaScript, and ESM config files
 */
export class ConfigLoader {
    cwd;
    config = null;
    configPath = null;
    /**
     * Create a new ConfigLoader instance
     * @param options Configuration options
     */
    constructor(options = {}) {
        this.cwd = options.cwd || process.cwd();
    }
    /**
     * Load and validate a Drizzle configuration file
     * Results are cached - subsequent calls with the same path return the cached config
     * @param configPath Path to config file (optional, will auto-detect if not provided)
     * @returns Promise resolving to validated Drizzle configuration
     * @throws Error if config file is not found or invalid
     */
    async loadConfig(configPath) {
        if (this.config && (!configPath || configPath === this.configPath)) {
            return this.config;
        }
        const resolvedPath = this.resolveConfigPath(configPath);
        if (!existsSync(resolvedPath)) {
            throw new Error(`Drizzle config file not found at: ${resolvedPath}`);
        }
        try {
            const configUrl = pathToFileURL(resolvedPath).href;
            const configModule = await import(configUrl);
            const rawConfig = configModule.default || configModule;
            this.config = DrizzleConfigSchema.parse(rawConfig);
            this.configPath = resolvedPath;
            return this.config;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
                throw new Error(`Invalid Drizzle config file: ${issues}`);
            }
            throw new Error(`Failed to load config file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    resolveConfigPath(configPath) {
        if (configPath) {
            return resolve(this.cwd, configPath);
        }
        // Try common config file names in order of preference
        const commonPaths = [
            "drizzle.config.ts",
            "drizzle.config.js",
            "drizzle.config.mjs",
        ];
        for (const path of commonPaths) {
            const fullPath = resolve(this.cwd, path);
            if (existsSync(fullPath)) {
                return fullPath;
            }
        }
        throw new Error("No drizzle config file found. Please specify a config path or create drizzle.config.ts");
    }
    /**
     * Get the directory containing the loaded config file
     * @returns Directory path of the config file
     * @throws Error if no config has been loaded
     */
    getConfigDirectory() {
        if (!this.configPath) {
            throw new Error("No config loaded. Call loadConfig() first.");
        }
        return dirname(this.configPath);
    }
    /**
     * Resolve a relative path from the config file's directory
     * @param path Relative path to resolve
     * @returns Absolute path resolved from config directory
     */
    resolvePathFromConfig(path) {
        const configDir = this.getConfigDirectory();
        return resolve(configDir, path);
    }
}
//# sourceMappingURL=config.js.map