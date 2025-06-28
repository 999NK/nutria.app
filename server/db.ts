import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// For local development with Supabase
const SUPABASE_DATABASE_URL = 'postgresql://postgres:15082003@db.tqmbeqzztihyibdflbjh.supabase.co:5432/postgres?sslmode=require';

// Use Supabase URL if in local dev mode, otherwise use provided DATABASE_URL
const databaseUrl = process.env.LOCAL_DEV_MODE === 'true' 
  ? SUPABASE_DATABASE_URL 
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });