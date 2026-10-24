import postgres from 'postgres';
import { config } from './config.js';

/**
 * Client Postgres (Supabase). `prepare: false` est requis par le pooler en mode transaction.
 * Toutes les tables vivent dans le schéma `playtrace` (voir schema.sql).
 */
export const sql = postgres(config.databaseUrl, {
  prepare: false,
  max: config.serverless ? 3 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});
