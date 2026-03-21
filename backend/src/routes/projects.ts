import { Hono } from "hono";
import { requireAuth, type AuthVariables } from "../middleware/auth";
import {
  createProject,
  listProjects,
  getProjectWithMessages,
  getProject,
  updateProject,
  softDeleteProject,
} from "../repositories/projects";

const projectsRouter = new Hono<{ Variables: AuthVariables }>();

projectsRouter.post("/", requireAuth, async (c) => {
  const user = c.get("user");
  const id = await createProject(user.id);
  return c.json({ id });
});

projectsRouter.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const rows = await listProjects(user.id);
  return c.json(rows);
});

projectsRouter.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const result = await getProjectWithMessages(c.req.param("id"), user.id);
  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json(result);
});

projectsRouter.patch("/:id/title", requireAuth, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const { title } = await c.req.json<{ title: string }>();

  if (typeof title !== "string" || title.trim().length === 0) {
    return c.json({ error: "Invalid request: title must be a non-empty string" }, 400);
  }

  const project = await getProject(id, user.id);
  if (!project) return c.json({ error: "Not found" }, 404);

  await updateProject(id, user.id, { title: title.trim(), updatedAt: new Date() });
  return c.json({ ok: true });
});

projectsRouter.delete("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const project = await getProject(id, user.id);
  if (!project) return c.json({ error: "Not found" }, 404);

  await softDeleteProject(id, user.id);
  return c.json({ ok: true });
});

export default projectsRouter;
