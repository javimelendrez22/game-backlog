import { BadRequestException } from '@nestjs/common';
import { createGameSchema } from '@org/contracts';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(createGameSchema);

  it('returns parsed data with schema defaults applied', () => {
    expect(pipe.transform({ title: 'Hades', platforms: ['pc'] })).toEqual({
      igdbId: null,
      title: 'Hades',
      platforms: ['pc'],
      genres: [],
      developer: null,
      publisher: null,
      releaseDate: null,
      coverImageUrl: null,
      status: 'backlog',
      rating: null,
      hoursPlayed: null,
    });
  });

  it('throws BadRequestException with field issues on invalid input', () => {
    let error: unknown;
    try {
      pipe.transform({ platforms: [] });
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(BadRequestException);
    const body = (error as BadRequestException).getResponse() as {
      issues: Record<string, string[]>;
    };
    expect(body.issues.title).toBeDefined();
    expect(body.issues.platforms).toBeDefined();
  });

  it('rejects a non-object body', () => {
    expect(() => pipe.transform('nope')).toThrow(BadRequestException);
  });
});
