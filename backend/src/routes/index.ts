import { Hono } from "hono";
import authRouter from "./auth";
import chatRouter from "./chat";
import projectsRouter from "./projects";

const router = new Hono();

router.route("/api/auth", authRouter);
router.route("/api/chat", chatRouter);
router.route("/api/projects", projectsRouter);

export default router;
