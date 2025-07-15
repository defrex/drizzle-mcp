# Drizzle MCP Server

A Model Context Protocol (MCP) server that provides access to Drizzle ORM database operations and drizzle-kit CLI tools.

## Features

- **Database Schema Management**: Generate and run migrations using drizzle-kit
- **Query Execution**: Execute raw SQL queries with parameter support
- **Schema Introspection**: Explore database tables and schema information
- **Database Resources**: Browse tables and schema through MCP resources
- **Cross-Project Compatibility**: Works with any existing Drizzle project

## Installation

Install globally via npm:

```bash
npm install -g drizzle-mcp
```

Or use with npx:

```bash
npx drizzle-mcp
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
      "args": ["drizzle-mcp", "./drizzle.config.ts"]
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

### Available Tools

1. **drizzle_generate_migration** - Generate new migration files
2. **drizzle_run_migrations** - Apply pending migrations
3. **drizzle_introspect_schema** - Introspect existing database schema
4. **execute_query** - Execute raw SQL queries
5. **initialize_database** - Initialize database connection

### Available Resources

1. **sqlite://tables** - List all database tables
2. **sqlite://schema** - Complete database schema information

## Requirements

- Node.js 18 or higher
- An existing Drizzle project with:
  - `drizzle-orm` >= 0.40.0
  - `drizzle-kit` >= 0.30.0
  - `better-sqlite3` >= 9.0.0 (for SQLite projects)

## Example Configuration

Example `drizzle.config.ts`:

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

## Supported Databases

Currently supports:
- **SQLite** - Via better-sqlite3

Support for PostgreSQL and MySQL is planned for future releases.

## Development

The server is built with:
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe development
- **Drizzle ORM** - Database ORM and query builder
- **Commander.js** - CLI argument parsing
- **MCP SDK** - Model Context Protocol implementation

### Building from Source

```bash
git clone https://github.com/yourusername/drizzle-mcp.git
cd drizzle-mcp
npm install
npm run build
```

## License

MIT
