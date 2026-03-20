import { Hono } from "hono";
import { auth } from "../lib/auth";

const authRouter = new Hono();

authRouter.on(["POST", "GET"], "/**", (c) => auth.handler(c.req.raw));

export default authRouter;
