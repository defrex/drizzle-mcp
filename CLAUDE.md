# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Install dependencies**: `bun install`
- **Run the MCP server**: `bun run index.ts`
- **Run tests**: `bun test`

## Project Architecture

This is a Bun-based TypeScript project that implements an MCP (Model Context Protocol) server for Drizzle ORM database operations. The server provides tools and resources for database schema management, migrations, and query execution.

### Key Components

- **Entry point**: `index.ts` - MCP server with stdio transport
- **Database config**: `drizzle.config.ts` - Drizzle configuration for SQLite
- **Schema definition**: `src/schema.ts` - Example database schema
- **TypeScript configuration**: Modern ESNext targeting with strict type checking enabled
- **Module system**: ES modules with bundler resolution
- **Runtime**: Bun (not Node.js)

## MCP Server Features

### Tools
- `drizzle_generate_migration` - Generate new migration files using drizzle-kit
- `drizzle_run_migrations` - Apply pending migrations to database
- `drizzle_introspect_schema` - Introspect existing database schema
- `execute_query` - Execute raw SQL queries with parameters
- `initialize_database` - Initialize database connection

### Resources
- `sqlite://tables` - List all database tables
- `sqlite://schema` - Complete database schema information

## Database Setup

The server uses SQLite as the default database with the following configuration:
- Database file: `./database.db`
- Migrations directory: `./migrations`
- Schema definition: `./src/schema.ts`

## Usage

1. Start the MCP server: `bun run index.ts`
2. Connect through MCP client (like Claude Desktop)
3. Use the provided tools to manage your database schema and run migrations
4. Query the database using the execute_query tool

## Development Notes

- The server automatically initializes the database connection when needed
- All drizzle-kit operations are executed via CLI commands
- The project uses better-sqlite3 for SQLite database operations
- TypeScript is configured with strict settings for better code quality