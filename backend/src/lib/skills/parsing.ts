export function normalizeSkillName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function parseFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const result: Record<string, string> = {};

  for (const line of match[1].split(/\r?\n/)) {
    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!fieldMatch) continue;
    result[fieldMatch[1].trim()] = fieldMatch[2].trim();
  }

  return result;
}

export function extractDescription(content: string) {
  const frontmatter = parseFrontmatter(content);
  if (frontmatter.description) return frontmatter.description;

  const lines = content.split(/\r?\n/).map((line) => line.trim());

  for (const line of lines) {
    if (!line || line === "---" || line.startsWith("#")) continue;
    if (line.includes(":")) {
      const [key, ...rest] = line.split(":");
      if (key.trim().toLowerCase() === "description") {
        return rest.join(":").trim();
      }
    }
    return line;
  }

  return "No description provided.";
}

