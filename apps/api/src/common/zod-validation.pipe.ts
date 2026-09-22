import { Injectable, PipeTransform } from "@nestjs/common";
import { z } from "zod";
import { ValidationError } from "./errors";

/**
 * Zod validation for bodies, queries and params.
 *
 * Returns the *parsed output*, so controllers receive normalised values
 * (trimmed, lower-cased, coerced) rather than raw input. Failures are
 * reported per-field so clients can attach messages to inputs.
 */
@Injectable()
export class ZodValidationPipe<Schema extends z.ZodTypeAny> implements PipeTransform<unknown, z.output<Schema>> {
  constructor(private readonly schema: Schema) {}

  transform(value: unknown): z.output<Schema> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const fieldErrors = result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "(root)",
      message: issue.message,
      code: issue.code,
    }));

    throw new ValidationError(
      fieldErrors.length === 1
        ? `${fieldErrors[0].field}: ${fieldErrors[0].message}`
        : `Validation failed for ${fieldErrors.length} fields`,
      fieldErrors
    );
  }
}

/** Convenience factory: `@Body(zodPipe(schema))`. */
export function zodPipe<Schema extends z.ZodTypeAny>(schema: Schema): ZodValidationPipe<Schema> {
  return new ZodValidationPipe(schema);
}
