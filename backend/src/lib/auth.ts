import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  crossSubDomainCookies: {
    enabled: true,
    domain: process.env.DOMAIN,
  },
  defaultCookieAttributes:
    process.env.ENV === "local"
      ? {
          // Localhost development settings
          sameSite: "lax",
          secure: true,
        }
      : {
          // Production cross-subdomain settings
          sameSite: "none",
          secure: true,
        },
  trustedOrigins: [process.env.APP_URL as string],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
