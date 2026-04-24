# ProConnect API

## Description

ProConnect API is a backend service built with NestJS, designed to support the ProConnect project. This API provides a robust and scalable server-side application using modern web technologies.

## Features

- Built with NestJS framework
- TypeScript for type-safe code
- PostgreSQL database integration with TypeORM
- JWT authentication
- Swagger API documentation
- Data validation using class-validator
- Migrations support for database versioning

## Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)
- PostgreSQL database

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pro-connect-api.git
   cd pro-connect-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env` (if not already done)
   - Update the `.env` file with your database credentials and other configuration

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The API will be available at `http://localhost:3010` by default.

## API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3010/api
```

This provides an interactive interface to explore and test the API endpoints.

## Database Migrations

This project uses TypeORM for database management. Since migrations are written in TypeScript, you need to build the project before running migrations.

```bash
# Build the project (required before running migrations)
npm run build

# Generate a new migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

**Note:** Always run `npm run build` before executing migrations to ensure the latest TypeScript code is compiled to JavaScript.

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

- `src/` - Contains the source code
  - `auth/` - Authentication related files
  - `migrations/` - Database migration files
  - `app.module.ts` - Main application module
  - `main.ts` - Application entry point
- `test/` - Contains test files
- `ormconfig.ts` - TypeORM configuration

## Technologies Used

- [NestJS](https://nestjs.com/) - A progressive Node.js framework
- [TypeORM](https://typeorm.io/) - ORM for TypeScript and JavaScript
- [PostgreSQL](https://www.postgresql.org/) - Open source relational database
- [Passport](http://www.passportjs.org/) - Authentication middleware for Node.js
- [Swagger](https://swagger.io/) - API documentation

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Support

For support, please open an issue in the GitHub repository or contact the project maintainers.

---

Developed with ❤️ for the ProConnect Project
