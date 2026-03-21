import { request } from "./client";

export interface Project {
  id: string;
  title: string | null;
  status: "active" | "deleted";
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  messages: {
    id: string;
    role: "user" | "assistant";
    content: { type: string; text?: string }[];
    createdAt: string;
  }[];
}

export const createProject = () =>
  request<{ id: string }>("/api/projects", { method: "POST" });

export const listProjects = () => request<Project[]>("/api/projects");

export const getProject = (id: string) =>
  request<ProjectDetail>(`/api/projects/${id}`);

export const deleteProject = (id: string) =>
  request(`/api/projects/${id}`, { method: "DELETE" });
