import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

/**
 * Validates and parses input with a Zod schema. Returns the parsed value,
 * so schema defaults and coercions apply:
 * `@Body(new ZodValidationPipe(createGameSchema)) body: CreateGame`.
 */
@Injectable()
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const { formErrors, fieldErrors } = z.flattenError(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        formErrors,
        issues: fieldErrors,
      });
    }
    return result.data;
  }
}
