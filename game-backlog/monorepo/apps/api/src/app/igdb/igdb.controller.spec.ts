import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  IgdbClient,
  IgdbNotConfiguredError,
  IgdbRequestError,
} from './igdb.client';
import { IgdbController } from './igdb.controller';
import { IgdbService } from './igdb.service';

function setup(query: (endpoint: string, body: string) => Promise<unknown>) {
  const client = { query: vi.fn(query) } as unknown as IgdbClient;
  const controller = new IgdbController(new IgdbService(client));
  return { controller, query: client.query as ReturnType<typeof vi.fn> };
}

describe('IgdbController.search', () => {
  it('sends an escaped search with the game-type filter and returns mapped items', async () => {
    const { controller, query } = setup(async () => [
      { id: 1, name: 'Say "Hi"' },
      { id: 'broken' }, // skipped, not fatal
    ]);

    const res = await controller.search({ search: 'say "hi" \\o/' });

    expect(res.items).toEqual([
      expect.objectContaining({ igdbId: 1, title: 'Say "Hi"' }),
    ]);
    const [endpoint, body] = query.mock.calls[0];
    expect(endpoint).toBe('games');
    expect(body).toContain('search "say \\"hi\\" \\\\o/";');
    expect(body).toContain(
      'where version_parent = null & game_type = (0,4,8,9,10,11);',
    );
    expect(body).toContain('limit 10;');
  });

  it('maps missing credentials to 503', async () => {
    const { controller } = setup(async () => {
      throw new IgdbNotConfiguredError();
    });
    await expect(controller.search({ search: 'gta' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('maps IGDB failures and non-array answers to 502', async () => {
    const failing = setup(async () => {
      throw new IgdbRequestError('IGDB /games responded 500', 500);
    });
    await expect(
      failing.controller.search({ search: 'gta' }),
    ).rejects.toBeInstanceOf(BadGatewayException);

    const weird = setup(async () => ({ message: 'not an array' }));
    await expect(
      weird.controller.search({ search: 'gta' }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
