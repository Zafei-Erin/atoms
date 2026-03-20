import { Hono } from "hono";
import authRouter from "./auth";

const router = new Hono();

router.route("/api/auth", authRouter);

export default router;
