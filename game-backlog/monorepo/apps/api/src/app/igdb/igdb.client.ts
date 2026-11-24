import { Injectable } from '@nestjs/common';

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const API_URL = 'https://api.igdb.com/v4';
/** Renew the token a minute before Twitch says it expires. */
const EXPIRY_MARGIN_MS = 60_000;
const TIMEOUT_MS = 8_000;

/** IGDB_CLIENT_ID / IGDB_CLIENT_SECRET are not set. */
export class IgdbNotConfiguredError extends Error {
  constructor() {
    super('IGDB is not configured: set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET');
    this.name = 'IgdbNotConfiguredError';
  }
}

/** Twitch or IGDB failed, timed out, or answered with a non-2xx status. */
export class IgdbRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'IgdbRequestError';
  }
}

interface Credentials {
  clientId: string;
  clientSecret: string;
}

interface TwitchToken {
  access_token: string;
  expires_in: number;
}

/**
 * Talks to the IGDB v4 API. Holds one app access token (client-credentials
 * grant) in memory, renews it before it expires or after a 401, and shares a
 * single token request between concurrent callers.
 */
@Injectable()
export class IgdbClient {
  private token?: { value: string; expiresAt: number };
  private pendingToken?: Promise<string>;

  /** POSTs an Apicalypse query, e.g. `query('games', 'search "x"; fields name;')`. */
  async query<T>(endpoint: string, apicalypse: string): Promise<T> {
    const creds = this.credentials();

    let res = await this.post(
      endpoint,
      apicalypse,
      creds,
      await this.getToken(creds),
    );
    if (res.status === 401) {
      // Token revoked or expired early: get a fresh one and try once more.
      this.token = undefined;
      res = await this.post(
        endpoint,
        apicalypse,
        creds,
        await this.getToken(creds),
      );
    }
    if (!res.ok) {
      throw new IgdbRequestError(
        `IGDB /${endpoint} responded ${res.status}`,
        res.status,
      );
    }
    return (await res.json()) as T;
  }

  private credentials(): Credentials {
    const clientId = process.env.IGDB_CLIENT_ID?.trim();
    const clientSecret = process.env.IGDB_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) throw new IgdbNotConfiguredError();
    return { clientId, clientSecret };
  }

  private getToken(creds: Credentials): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) {
      return Promise.resolve(this.token.value);
    }
    this.pendingToken ??= this.fetchToken(creds).finally(() => {
      this.pendingToken = undefined;
    });
    return this.pendingToken;
  }

  private async fetchToken({ clientId, clientSecret }: Credentials) {
    // Form body rather than query string, so the secret stays out of URLs and logs.
    const res = await this.send(TOKEN_URL, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });
    if (!res.ok) {
      throw new IgdbRequestError(
        `Twitch token request responded ${res.status}`,
        res.status,
      );
    }
    const data = (await res.json()) as TwitchToken;
    this.token = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - EXPIRY_MARGIN_MS,
    };
    return data.access_token;
  }

  private post(
    endpoint: string,
    apicalypse: string,
    { clientId }: Credentials,
    token: string,
  ) {
    return this.send(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'text/plain',
      },
      body: apicalypse,
    });
  }

  private async send(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new IgdbRequestError(
        `Request to ${new URL(url).host} failed: ${(err as Error).message}`,
        undefined,
        { cause: err },
      );
    }
  }
}
