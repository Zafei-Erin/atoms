import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./auth-schema";
import * as chatSchema from "./chat-schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL,
    // Disable certificate verification for managed cloud databases (e.g. Supabase, Neon)
    // that use self-signed or untrusted CA certs. Remove in environments with valid certs.
    // ssl: { rejectUnauthorized: false },
    ssl: false,
  },
  schema: { ...authSchema, ...chatSchema },
});
