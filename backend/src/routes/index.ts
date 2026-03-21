import { Hono } from "hono";
import authRouter from "./auth";
import chatRouter from "./chat";

const router = new Hono();

router.route("/api/auth", authRouter);
router.route("/api/chat", chatRouter);

export default router;
