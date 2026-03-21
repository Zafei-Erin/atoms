import * as path from "node:path";
import { findSkillFiles, readUtf8File, skillsDir } from "./filesystem";
import { extractDescription, normalizeSkillName, parseFrontmatter } from "./parsing";
import type { SkillRecord, SkillSummary } from "./types";

export class SkillLoader {
  private cache: SkillRecord[] | null = null;

  async listSkills(): Promise<SkillSummary[]> {
    const records = await this.loadSkills();
    return records.map(({ name, description, filePath }) => ({
      name,
      description,
      filePath,
    }));
  }

  async loadSkill(name: string) {
    const records = await this.loadSkills();
    const normalizedQuery = normalizeSkillName(name);
    const match = records.find((record) =>
      record.aliases.some((alias) => alias === normalizedQuery),
    );

    if (!match) {
      const available = records
        .map((record) => `- ${record.name}: ${record.description}`)
        .join("\n");

      return [
        `Skill "${name}" not found.`,
        available ? `Available skills:\n${available}` : "No skills available.",
      ].join("\n\n");
    }

    return [
      `Loaded skill: ${match.name}`,
      `Source: ${match.filePath}`,
      match.content,
    ].join("\n\n");
  }

  private async loadSkills() {
    if (this.cache) return this.cache;

    const records: SkillRecord[] = [];
    const skillFiles = await findSkillFiles(skillsDir);

    for (const filePath of skillFiles) {
      const content = await readUtf8File(filePath);
      const folderName = path.basename(path.dirname(filePath));
      const frontmatter = parseFrontmatter(content);
      const nameMatch = content.match(/^#\s+(.+)$/m);
      const name =
        frontmatter.name?.trim() || nameMatch?.[1]?.trim() || folderName;
      const description = extractDescription(content);

      records.push({
        name,
        description,
        filePath,
        content,
        aliases: [
          normalizeSkillName(name),
          normalizeSkillName(folderName),
          normalizeSkillName(path.relative(skillsDir, path.dirname(filePath))),
        ],
      });
    }

    this.cache = records;
    return records;
  }
}
