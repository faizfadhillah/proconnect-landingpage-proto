// src/logging/logging.service.ts
// Logs go to Pino only (stdout + file). No DB persistence; use Grafana/Loki for querying.
import { Injectable } from "@nestjs/common";
import { RequestContextService } from "../common/request-context/request-context.service";
import { Logger as PinoLogger } from "pino";
import { createPinoLogger } from "./pino.config";

@Injectable()
export class LoggingService {
  private readonly pinoLogger: PinoLogger;

  constructor(private readonly requestContextService: RequestContextService) {
    this.pinoLogger = createPinoLogger();
  }

  async logMessage(level: string, message: string, tags?: string, meta?: any) {
    tags = tags || "general";

    const requestId = this.requestContextService.getRequestId();

    // Single-line format for Loki/Docker: one log call = one line.
    const metaStr =
      meta && typeof meta === "object" && Object.keys(meta).length > 0
        ? " " + JSON.stringify(meta)
        : "";
    const logMessage = `[${requestId}] [${tags}] ${message} ${metaStr}`;

    const normalizedLevel = level.toLowerCase();
    const pinoLevel = (normalizedLevel === "log" ? "info" : normalizedLevel) as
      | "info"
      | "warn"
      | "error"
      | "debug"
      | "fatal";

    this.pinoLogger[pinoLevel]({}, logMessage);
  }

  /**
   * Info-level logging helper
   * Disarankan dipakai untuk log normal (non-error)
   */
  info(message: string, tags?: string, meta?: any) {
    // Don't await the async operation to avoid blocking
    this.logMessage("info", message, tags, meta).catch(() => {});
  }

  log(message: string, tags?: string, meta?: any) {
    this.logMessage("log", message, tags, meta).catch(() => {});
  }

  error(message: string, tags?: string, trace?: string, meta?: any) {
    // Don't await the async operation to avoid blocking
    this.logMessage("error", message, tags, { trace, ...meta }).catch(() => {});
  }

  warn(message: string, tags?: string, meta?: any) {
    // Don't await the async operation to avoid blocking
    this.logMessage("warn", message, tags, meta).catch(() => {});
  }

  debug(message: string, tags?: string, meta?: any) {
    // Don't await the async operation to avoid blocking
    this.logMessage("debug", message, tags, meta).catch(() => {});
  }

  verbose(message: string, tags?: string, meta?: any) {
    // Don't await the async operation to avoid blocking
    this.logMessage("verbose", message, tags, meta).catch(() => {});
  }
}
