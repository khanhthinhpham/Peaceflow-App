import pkg from 'pg';
import { env } from './env.js';

const { Pool } = pkg;

export const db = new Pool({
  connectionString: env.databaseUrl
});
