import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { projects, messages } from "../db/chat-schema";
import { generateId } from "../lib/id";

export async function createProject(userId: string) {
  const id = generateId();
  await db.insert(projects).values({ id, userId, status: "active" });
  return id;
}

export async function listProjects(userId: string) {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.status, "active")))
    .orderBy(desc(projects.updatedAt));
}

export async function getProject(id: string, userId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, userId)),
  });
  if (!project || project.status === "deleted") return null;
  return project;
}

export async function getProjectWithMessages(id: string, userId: string) {
  const project = await getProject(id, userId);
  if (!project) return null;

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.projectId, id))
    .orderBy(messages.createdAt);

  return { ...project, messages: msgs };
}

export async function updateProject(
  id: string,
  userId: string,
  data: Partial<{ title: string; status: string; updatedAt: Date }>,
) {
  await db.update(projects).set(data).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function softDeleteProject(id: string, userId: string) {
  await updateProject(id, userId, { status: "deleted", updatedAt: new Date() });
}
