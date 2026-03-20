import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./auth-schema";

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  schema: { ...authSchema },
});
