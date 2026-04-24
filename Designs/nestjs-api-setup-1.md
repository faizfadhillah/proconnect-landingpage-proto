# Setting up a NestJS API with Swagger, TypeORM Migrations, and JWT Auth

## 1. Project Setup

First, let's create a new NestJS project:

```bash
# Install NestJS CLI globally if you haven't already
npm i -g @nestjs/cli

# Create new project
nest new your-project-name

# Navigate to project directory
cd your-project-name

# Install required dependencies
npm install @nestjs/swagger swagger-ui-express
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcryptjs
npm install class-validator class-transformer
```

## 2. Database Configuration

Create `ormconfig.ts` in the root directory:

```typescript
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'your_username',
  password: 'your_password',
  database: 'your_database',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: false,
});
```

## 3. Environment Configuration

Create `.env` file in the root directory:

```plaintext
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
```

## 4. Setting up TypeORM in app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        migrations: ['dist/migrations/*{.ts,.js}'],
        synchronize: false,
      }),
    }),
  ],
})
export class AppModule {}
```

## 5. Setting up Swagger

Update `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Your API')
    .setDescription('Your API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

## 6. Creating Migrations from SQL DDL

1. Create a migration file:

```bash
npm run typeorm:cli -- migration:create ./src/migrations/InitialSchema
```

2. In the generated migration file, paste your SQL DDL:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Your SQL DDL goes here
    await queryRunner.query(`
      -- Your SQL DDL statements
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the migrations (drop tables in reverse order)
  }
}
```

## 7. Setting up JWT Authentication

Create an auth module:

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRATION'),
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

Create JWT strategy:

```typescript
// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

## 8. Add Scripts to package.json

```json
{
  "scripts": {
    // ... other scripts
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- migration:generate -d ormconfig.ts",
    "migration:run": "npm run typeorm -- migration:run -d ormconfig.ts",
    "migration:revert": "npm run typeorm -- migration:revert -d ormconfig.ts"
  }
}
```

## 9. Using JWT Guard in Controllers

Example protected controller:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('protected')
@ApiBearerAuth()
@Controller('protected')
@UseGuards(AuthGuard('jwt'))
export class ProtectedController {
  @Get()
  getProtectedData() {
    return { message: 'This is protected data' };
  }
}
```

## Running the Application

1. Run migrations:
```bash
npm run migration:run
```

2. Start the application:
```bash
npm run start:dev
```

3. Access Swagger documentation at: http://localhost:3000/api

Remember to:
- Replace placeholder values in the configuration files
- Implement proper error handling
- Add appropriate validation to DTOs
- Implement proper password hashing in the auth service
- Add appropriate logging
- Set up proper CORS configuration if needed
