# Drizzle MCP Server

A Model Context Protocol (MCP) server that provides access to Drizzle ORM database operations and drizzle-kit CLI tools.

## Features

- **Database Schema Management**: Generate and run migrations using drizzle-kit
- **Query Execution**: Execute raw SQL queries with parameter support
- **Schema Introspection**: Explore database tables and schema information
- **Database Resources**: Browse tables and schema through MCP resources
- **Cross-Project Compatibility**: Works with any existing Drizzle project
- **Multi-Database Support**: SQLite and PostgreSQL with automatic driver detection
- **Environment Variable Support**: Automatic .env file loading for database credentials
- **Flexible Installation**: Install globally, run with npx/bunx, or use as a linked package

## Installation

### Option 1: Install globally from GitHub

```bash
npm install -g github:defrex/drizzle-mcp
```

### Option 2: Run directly with npx/bunx (no installation required)

```bash
npx github:defrex/drizzle-mcp --help
bunx github:defrex/drizzle-mcp --help
```

### Option 3: Link for development (if working on the package)

```bash
# In the drizzle-mcp directory
bun link

# In your project directory
bun link drizzle-mcp
```

## Usage

### Basic Usage

Run the server with your Drizzle config file:

```bash
drizzle-mcp ./drizzle.config.ts
```

Or use the config option:

```bash
drizzle-mcp --config ./drizzle.config.ts
```

### Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "drizzle": {
      "command": "npx",
      "args": ["github:defrex/drizzle-mcp", "./drizzle.config.ts"]
    }
  }
}
```

Or with bunx:

```json
{
  "mcpServers": {
    "drizzle": {
      "command": "bunx",
      "args": ["github:defrex/drizzle-mcp", "./drizzle.config.ts"]
    }
  }
}
```

### Command Line Options

```bash
drizzle-mcp [options] [config]

Arguments:
  config               Path to drizzle config file

Options:
  -V, --version        output the version number
  -c, --config <path>  Path to drizzle config file
  -d, --cwd <path>     Working directory (default: current directory)
  -v, --verbose        Enable verbose logging
  -h, --help           display help for command
```

### Configuration

The server automatically detects your Drizzle configuration from:
- Command line argument: `drizzle-mcp ./my-config.ts`
- Current directory: `drizzle.config.ts`, `drizzle.config.js`, or `drizzle.config.mjs`

Your Drizzle config should be a standard drizzle-kit configuration file.

### Environment Variables

The server automatically loads environment variables from `.env.local` and `.env` files in your project directory. This is useful for database credentials:

```bash
# .env.local
DATABASE_URL=postgresql://username:password@localhost:5432/database
```

The server will detect and use `DATABASE_URL` from your environment variables, so you can use it in your drizzle config:

```typescript
export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // ...
});
```

### Available Tools

1. **drizzle_generate_migration** - Generate new migration files
2. **drizzle_run_migrations** - Apply pending migrations
3. **drizzle_introspect_schema** - Introspect existing database schema
4. **execute_query** - Execute raw SQL queries
5. **initialize_database** - Initialize database connection

### Available Resources

1. **database://tables** - List all database tables
2. **database://schema** - Complete database schema information

*Note: Resources are database-agnostic and work with both SQLite and PostgreSQL*

## Requirements

- Node.js 18 or higher
- An existing Drizzle project with:
  - `drizzle-orm` >= 0.40.0
  - `drizzle-kit` >= 0.30.0
  - For SQLite: `better-sqlite3` >= 9.0.0
  - For PostgreSQL: `pg` >= 8.0.0 OR `postgres` >= 3.4.0

*Note: The server automatically detects which database driver you have installed and uses the appropriate one.*

## Example Configuration

### SQLite Configuration

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./database.db",
  },
});
```

### PostgreSQL Configuration

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    // Or use individual credentials:
    // host: "localhost",
    // port: 5432,
    // user: "username",
    // password: "password",
    // database: "database",
  },
});
```

*Note: The server supports both `pg` (node-postgres) and `postgres` (postgres-js) drivers. It will automatically detect which one you have installed and use the appropriate one.*

## Supported Databases

Currently supports:
- **SQLite** - Via `better-sqlite3`
- **PostgreSQL** - Via `pg` (node-postgres) or `postgres` (postgres-js)

The server automatically detects which database drivers you have installed and uses the appropriate ones. For PostgreSQL, it will try `postgres` first, then fall back to `pg`.

Support for MySQL is planned for future releases.

## Development

The server is built with:
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe development
- **Drizzle ORM** - Database ORM and query builder
- **Commander.js** - CLI argument parsing
- **MCP SDK** - Model Context Protocol implementation
- **dotenv** - Environment variable loading

### Building from Source

```bash
git clone https://github.com/defrex/drizzle-mcp.git
cd drizzle-mcp
bun install
bun run build
```

### Key Features

- **Automatic Module Resolution**: Resolves database drivers and drizzle-orm from your project's dependencies
- **Environment Variable Loading**: Automatically loads `.env.local` and `.env` files from your project
- **Cross-Platform**: Works with npm, bun, and various package managers
- **Comprehensive Error Handling**: Detailed error messages with context for easier debugging
- **Security**: Input validation and sanitization for all user inputs

## License

MIT
