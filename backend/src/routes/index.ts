import { Hono } from "hono";
import authRouter from "./auth";
import chatRouter from "./chat";
import projectsRouter from "./projects";
import wpsRouter from "./wps";

const router = new Hono();

router.route("/api/auth", authRouter);
router.route("/api/chat", chatRouter);
router.route("/api/projects", projectsRouter);
router.route("/v3/3rd", wpsRouter);

export default router;
