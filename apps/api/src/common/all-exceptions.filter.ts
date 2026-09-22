import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { AppError, ErrorBody, ErrorCode } from "./errors";

/**
 * Single exit point for every error leaving the API.
 *
 * Guarantees:
 *  - the response shape is always `{ error: { code, message, ... } }`
 *  - internal details (stack traces, SQL, provider payloads) never reach a client
 *  - every 5xx is logged with its stack and a request id for correlation
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();
    const requestId = req.id ?? (req.headers["x-request-id"] as string | undefined);

    const { status, body, logLevel } = this.translate(exception, requestId);

    if (logLevel === "error") {
      this.logger.error(
        {
          requestId,
          method: req.method,
          url: req.url,
          status,
          code: body.error.code,
          err: exception instanceof Error ? { message: exception.message, stack: exception.stack } : exception,
        },
        `Unhandled error on ${req.method} ${req.url}`
      );
    } else {
      this.logger.debug(
        { requestId, method: req.method, url: req.url, status, code: body.error.code },
        body.error.message
      );
    }

    res.status(status).json(body);
  }

  private translate(
    exception: unknown,
    requestId?: string
  ): { status: number; body: ErrorBody; logLevel: "error" | "debug" } {
    // 1. Deliberate application errors — safe to expose verbatim.
    if (exception instanceof AppError) {
      return {
        status: exception.getStatus(),
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            details: exception.details,
            requestId,
          },
        },
        logLevel: "debug",
      };
    }

    // 2. Framework HttpExceptions (guards, throttler, payload limits…).
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === "string"
          ? response
          : ((response as { message?: string | string[] }).message ?? exception.message);

      return {
        status,
        body: {
          error: {
            code: this.codeForStatus(status),
            message: Array.isArray(message) ? message.join("; ") : message,
            requestId,
          },
        },
        logLevel: status >= 500 ? "error" : "debug",
      };
    }

    // 3. Prisma errors — mapped, never leaked (they contain SQL and column names).
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return { ...this.translatePrisma(exception, requestId) };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          error: { code: ErrorCode.VALIDATION_FAILED, message: "Invalid request data", requestId },
        },
        logLevel: "error",
      };
    }

    if (
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError
    ) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        body: {
          error: {
            code: ErrorCode.SERVICE_UNAVAILABLE,
            message: "The service is temporarily unavailable. Please retry shortly.",
            requestId,
          },
        },
        logLevel: "error",
      };
    }

    // 4. Anything else is a bug: log it fully, tell the client nothing.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: "An unexpected error occurred. Our team has been notified.",
          requestId,
        },
      },
      logLevel: "error",
    };
  }

  private translatePrisma(
    e: Prisma.PrismaClientKnownRequestError,
    requestId?: string
  ): { status: number; body: ErrorBody; logLevel: "error" | "debug" } {
    switch (e.code) {
      case "P2002": {
        // Unique constraint. Surfacing the field names is safe and useful.
        const target = (e.meta?.target as string[] | string | undefined) ?? [];
        const fields = Array.isArray(target) ? target.join(", ") : String(target);
        return {
          status: HttpStatus.CONFLICT,
          body: {
            error: {
              code: ErrorCode.DUPLICATE_RESOURCE,
              message: fields ? `A record with this ${fields} already exists` : "Record already exists",
              requestId,
            },
          },
          logLevel: "debug",
        };
      }
      case "P2003":
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            error: {
              code: ErrorCode.BUSINESS_RULE_VIOLATION,
              message: "Referenced record does not exist",
              requestId,
            },
          },
          logLevel: "debug",
        };
      case "P2025":
        return {
          status: HttpStatus.NOT_FOUND,
          body: { error: { code: ErrorCode.NOT_FOUND, message: "Record not found", requestId } },
          logLevel: "debug",
        };
      case "P2034":
        // Write conflict / deadlock — the client may safely retry.
        return {
          status: HttpStatus.CONFLICT,
          body: {
            error: {
              code: ErrorCode.CONCURRENT_MODIFICATION,
              message: "The record was modified concurrently. Please retry.",
              requestId,
            },
          },
          logLevel: "debug",
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            error: { code: ErrorCode.INTERNAL_ERROR, message: "A database error occurred", requestId },
          },
          logLevel: "error",
        };
    }
  }

  private codeForStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHENTICATED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return ErrorCode.PAYLOAD_TOO_LARGE;
      case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
        return ErrorCode.UNSUPPORTED_MEDIA_TYPE;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE;
      default:
        return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BUSINESS_RULE_VIOLATION;
    }
  }
}
