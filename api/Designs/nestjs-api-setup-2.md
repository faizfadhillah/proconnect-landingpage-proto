# TypeORM Migration Setup and Commands

## 1. First, update your package.json scripts:

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "typeorm": "ts-node ./node_modules/typeorm/cli",
    "migration:create": "npm run typeorm migration:create",
    "migration:generate": "npm run typeorm migration:generate -d ormconfig.ts",
    "migration:run": "npm run typeorm migration:run -d ormconfig.ts",
    "migration:revert": "npm run typeorm migration:revert -d ormconfig.ts"
  }
}
```

## 2. Create the migrations directory:

```bash
mkdir src/migrations
```

## 3. To create a new migration:

```bash
# For TypeORM 0.3.x
npm run typeorm migration:create ./src/migrations/InitialSchema

# Or use this alternative command
npx typeorm migration:create ./src/migrations/InitialSchema
```

## 4. Example migration file (src/migrations/[timestamp]-InitialSchema.ts):

```typescript
import { MigrationInterface, QueryRunner } from "typeorm"

export class InitialSchema1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Your SQL DDL goes here
        await queryRunner.query(`
            -- Paste your SQL DDL statements here
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                -- ... other columns
            );
            
            -- ... other tables
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the changes (drop tables in reverse order)
        await queryRunner.query(`
            DROP TABLE IF EXISTS users;
            -- ... drop other tables
        `);
    }
}
```

## 5. Running migrations:

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 6. Make sure your ormconfig.ts is properly configured:

```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config(); // Load .env file

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    synchronize: false,
});

export default AppDataSource;
```

## Troubleshooting Tips

1. If you get "command not found" errors:
   ```bash
   # Install TypeORM CLI globally
   npm install -g typeorm
   ```

2. If you get typescript errors:
   ```bash
   npm install --save-dev ts-node @types/node
   ```

3. Make sure your tsconfig.json includes:
   ```json
   {
     "compilerOptions": {
       "emitDecoratorMetadata": true,
       "experimentalDecorators": true
     }
   }
   ```

4. For path resolution issues:
   ```typescript
   // Update ormconfig.ts paths
   entities: [__dirname + '/**/*.entity{.ts,.js}'],
   migrations: [__dirname + '/migrations/*{.ts,.js}'],
   ```

## Common Migration Commands

```bash
# Create a new empty migration
npm run migration:create ./src/migrations/YourMigrationName

# Generate a migration from entity changes
npm run migration:generate ./src/migrations/YourMigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run typeorm migration:show
```
