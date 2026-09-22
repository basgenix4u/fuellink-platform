import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Stable, machine-readable error codes. Clients branch on `code`, never on
 * the human-readable message (which may be reworded or localised).
 */
export enum ErrorCode {
  // 400
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_STATE_TRANSITION = "INVALID_STATE_TRANSITION",
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  INSUFFICIENT_INVENTORY = "INSUFFICIENT_INVENTORY",
  LISTING_EXPIRED = "LISTING_EXPIRED",
  IDEMPOTENCY_KEY_REUSED = "IDEMPOTENCY_KEY_REUSED",

  // 401 / 403
  UNAUTHENTICATED = "UNAUTHENTICATED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",
  FORBIDDEN = "FORBIDDEN",
  ORG_NOT_VERIFIED = "ORG_NOT_VERIFIED",
  INSUFFICIENT_ORG_ROLE = "INSUFFICIENT_ORG_ROLE",

  // 404 / 409
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
  CONCURRENT_MODIFICATION = "CONCURRENT_MODIFICATION",
  REQUEST_IN_FLIGHT = "REQUEST_IN_FLIGHT",

  // 413 / 415 / 429
  PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",
  RATE_LIMITED = "RATE_LIMITED",

  // 5xx
  INTERNAL_ERROR = "INTERNAL_ERROR",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export interface ErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    /** Field-level detail for validation failures. */
    details?: unknown;
    /** Correlates the client report with server logs. */
    requestId?: string;
  };
}

/**
 * Base class for all deliberate application errors. Anything thrown that is
 * *not* an AppError is treated as an unexpected fault: logged with a stack
 * trace and reported to the client as a generic INTERNAL_ERROR.
 */
export class AppError extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    public readonly details?: unknown
  ) {
    super({ code, message, details }, status);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(ErrorCode.VALIDATION_FAILED, message, HttpStatus.BAD_REQUEST, details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.BUSINESS_RULE_VIOLATION, details?: unknown) {
    super(code, message, HttpStatus.BAD_REQUEST, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Authentication required", code: ErrorCode = ErrorCode.UNAUTHENTICATED) {
    super(code, message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action", code: ErrorCode = ErrorCode.FORBIDDEN) {
    super(code, message, HttpStatus.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(ErrorCode.NOT_FOUND, `${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.CONFLICT, details?: unknown) {
    super(code, message, HttpStatus.CONFLICT, details);
  }
}

/**
 * Raised when an optimistic-locked row changed under us. Callers may retry.
 */
export class ConcurrencyError extends ConflictError {
  constructor(resource = "Resource") {
    super(
      `${resource} was modified by another request. Reload and try again.`,
      ErrorCode.CONCURRENT_MODIFICATION
    );
  }
}
