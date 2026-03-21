import { promises as fs } from "node:fs";
import * as path from "node:path";

export const skillsDir = path.resolve(__dirname, "../../../src/skills");

export async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function findSkillFiles(rootDir: string): Promise<string[]> {
  if (!(await pathExists(rootDir))) return [];

  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findSkillFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name === "SKILL.md") {
      files.push(fullPath);
    }
  }

  return files;
}

export async function readUtf8File(filePath: string) {
  return fs.readFile(filePath, "utf8");
}
