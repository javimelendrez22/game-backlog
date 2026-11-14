import { Inject } from '@nestjs/common';

export const DB = Symbol('DB');
export const DB_POOL = Symbol('DB_POOL');

/** Injects the Drizzle client: `constructor(@InjectDb() private db: Database)`. */
export const InjectDb = () => Inject(DB);
