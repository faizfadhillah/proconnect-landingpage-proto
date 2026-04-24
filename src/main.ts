import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app/app.module";
import { ConfigService } from "@nestjs/config";
import { useContainer } from "class-validator";
import * as express from "express";
import { RedocModule, RedocOptions } from "nestjs-redoc";
import { BackendExceptionFilter } from "./global_filter/backend-exception.filter";
import { LoggingInterceptor } from "./global_filter/logging.interceptor";
import { cacheControlMiddleware } from "./global_filter/cache-control.middleware";
import { ShutdownService } from "./app/shutdown.service";
import { LoggingService } from "./logs/logs.service";
import { setupBullBoard } from "./queues/bull-board.helper";
import { RbacService } from "./rbac/rbac.service";

// Fix: Ensure built-in Node.js crypto module is available
// This prevents npm package "crypto" from overriding the built-in module
// @nestjs/schedule uses crypto.randomUUID() which requires the built-in crypto module
try {
  // Force require built-in crypto module (not npm package)
  const nodeCrypto = require("node:crypto");
  // Make it available globally if needed
  if (typeof globalThis.crypto === "undefined") {
    globalThis.crypto = nodeCrypto as any;
  }
} catch (e) {
  // Fallback to regular require if node: prefix not supported
  const nodeCrypto = require("crypto");
  if (typeof globalThis.crypto === "undefined") {
    globalThis.crypto = nodeCrypto as any;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Enable graceful shutdown
    abortOnError: false,
  });
  const env: ConfigService = app.get(ConfigService);
  const loggingService = app.get(LoggingService);

  app.enableCors({
    origin: [
      "http://localhost:3011",
      "http://34.101.86.208:3011",
      "https://proconnect.fivestarstudio.id",
      "https://v32.proconnect.fivestarstudio.id",
      "https://stg.proconnect.fivestarstudio.id",
      "http://proconnectjob.com",
      "https://proconnectjob.com",
      "http://proconnectcareer.com",
      "https://proconnectcareer.com",
      "http://www.proconnectcareer.com",
      "https://www.proconnectcareer.com",
    ],
    credentials: true,
  });

  // Global Middleware: Safe to apply to all routes - prevents caching
  app.use(cacheControlMiddleware);

  // Validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global logging interceptor for request/response logging (PUT/POST/PATCH only)
  app.useGlobalInterceptors(app.get(LoggingInterceptor));

  // Global exception filter for consistent error responses
  app.useGlobalFilters(app.get(BackendExceptionFilter));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle("ProConnect API 0.2")
    .setDescription("Untuk ProConnect Project")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      sort: "alpha",
      apisSorter: "alpha",
      tagsSorter: "alpha",
      operationsSorter: "alpha",
      docExpansion: "list",
      layout: "BaseLayout",
    },
  });

  // Redoc setup
  const redocOptions: RedocOptions = {
    title: "ProConnect API Docs",
    logo: {
      url: "https://proconnect.fivestarstudio.id/logo.svg",
      backgroundColor: "#F0F0F0",
      altText: "Logo",
    },
    sortPropsAlphabetically: true,
    hideDownloadButton: false,
    hideHostname: false,
    tagGroups: [
      {
        name: "User Management",
        tags: [
          "users",
          "user-files",
          "user-certificates",
          "user-educations",
          "user-languages",
          "user-professions",
          "user-right-to-work",
          "user-skills",
          "user-career-history",
          "user-skill-passports",
          "user-subscription",
          "user-salary-country",
          "user-interests",
        ],
      },
      {
        name: "Job Management",
        tags: [
          "jobs",
          "job-skills",
          "job-steps",
          "applicants",
          "applicant-steps",
          "applicant-legal-files",
          "applicant-job-steps",
        ],
      },
      {
        name: "Company Management",
        tags: ["mst-companies", "company-files", "follow-user-to-companies"],
      },
      {
        name: "Master Data",
        tags: [
          "mst-schools",
          "mst-languages",
          "mst-professions",
          "mst-skills",
          "mst-regions",
          "mst-right-to-works",
          "mst-subscription",
          "mst-tags",
          "mst-interests",
          "mst-salary-country",
          "mst-country",
          "mst-asp-competencies",
        ],
      },
      {
        name: "Social & Communication",
        tags: [
          "posts",
          "events",
          "event-pakets",
          "groups",
          "group-members",
          "follow-user-to-user",
          "feedbacks",
        ],
      },
      {
        name: "System",
        tags: [
          "auth",
          "rbac",
          "configs",
          "logs",
          "media",
          "storage",
          "fields",
          "questionnaires",
          "questionnaire-answers",
          "invoices",
          "invoices-items",
        ],
      },
    ],
  };

  RedocModule.setup("/docs", app as any, document, redocOptions);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(express.json({ limit: "50mb" })); // Tingkatkan dari 10mb ke 50mb
  app.use(express.urlencoded({ limit: "50mb", extended: true })); // Tingkatkan untuk form-data

  // Setup graceful shutdown handlers
  const shutdownService = app.get(ShutdownService);
  shutdownService.setup(app);

  // Setup Bull Board for queue monitoring
  setupBullBoard(app, loggingService, env.get("PORT") || 3000);

  const port = env.get("PORT") || 3000;
  await app.listen(port);

  loggingService.log(
    `Application is running on: http://localhost:${port}`,
    "bootstrap",
  );

  // Run RBAC seed on every startup (idempotent: skips existing entries)
  try {
    const rbacService = app.get(RbacService);
    const seedResult = await rbacService.seedRbac();
    loggingService.log(
      `RBAC seed completed: ${seedResult.inserted} inserted, ${seedResult.skipped} skipped`,
      "bootstrap",
    );
  } catch (err) {
    loggingService.error(
      "RBAC seed failed on startup",
      "bootstrap",
      err?.stack ?? String(err),
    );
  }
}

bootstrap();
