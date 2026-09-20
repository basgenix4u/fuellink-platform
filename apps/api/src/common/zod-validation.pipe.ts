import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { z } from "zod";

/**
 * Zod-based body/query validation. Parses on the way in; returns the
 * *transformed* (normalized) output value, so controllers receive clean
 * input. Generic over the schema type — works with `.default()`,
 * `.transform()` and optional inputs without variance friction.
 */
@Injectable()
export class ZodValidationPipe<Schema extends z.ZodTypeAny> implements PipeTransform<unknown, z.output<Schema>> {
  constructor(private readonly schema: Schema) {}

  transform(value: unknown): z.output<Schema> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new BadRequestException(message);
    }
    return result.data;
  }
}
