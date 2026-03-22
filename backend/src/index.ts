import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import router from "./routes";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (
        origin &&
        (origin.includes(process.env.APP_URL as string) ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1"))
      ) {
        return origin;
      }
      return null;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"],
    credentials: true,
  }),
);

app.route("/", router);

app.get("/", (c) => {
  return c.json({ message: "Hello from Hono!" });
});

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
});
