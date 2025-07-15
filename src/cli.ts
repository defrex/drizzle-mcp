#!/usr/bin/env node

import { Command } from "commander";
import { DrizzleMCPServer } from "./server.js";
import { resolve } from "node:path";

const program = new Command();

program
  .name("drizzle-mcp")
  .description("A Model Context Protocol server for Drizzle ORM")
  .version("1.0.0");

program
  .argument("[config]", "Path to drizzle config file")
  .option("-c, --config <path>", "Path to drizzle config file")
  .option("-d, --cwd <path>", "Working directory", process.cwd())
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (configArg, options) => {
    const configPath = options.config || configArg;
    const cwd = resolve(options.cwd);
    
    if (options.verbose) {
      console.error(`Starting Drizzle MCP Server...`);
      console.error(`Working directory: ${cwd}`);
      console.error(`Config file: ${configPath || "auto-detected"}`);
    }

    const server = new DrizzleMCPServer(cwd);
    
    try {
      // If config path is provided, validate it early
      if (configPath) {
        await server.loadConfig(configPath);
        if (options.verbose) {
          console.error(`Config loaded successfully from: ${configPath}`);
        }
      }
      
      await server.start();
      
      if (options.verbose) {
        console.error("Server started and listening on stdio");
      }
    } catch (error) {
      console.error(`Error starting server: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      if (options.verbose) {
        console.error("Shutting down server...");
      }
      await server.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      if (options.verbose) {
        console.error("Shutting down server...");
      }
      await server.stop();
      process.exit(0);
    });
  });

program.parse();