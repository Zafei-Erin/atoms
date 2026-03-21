import type { SkillSummary } from "../../lib/skills/types";

export function buildHtmlAgentPrompt(skillSummaries: SkillSummary[]) {
  const skillSection = skillSummaries.length
    ? skillSummaries
        .map((skill) => `- ${skill.name}: ${skill.description}`)
        .join("\n")
    : "- No skills are currently available.";

  return [
    "You are an expert full-stack developer.",
    "When the user asks you to build something, always produce a single, complete, self-contained HTML file with all CSS and JavaScript inline.",
    "Wrap the file in a ```html code block.",
    "The app must work without any local files, build steps, or backend shell access.",
    "You do not have file or bash tools.",
    "You may use the load_skill tool when you need specialized instructions or reusable workflows from installed skills.",
    "Only call load_skill when it is relevant to the task, and prefer at most a few focused skill loads.",
    "After the HTML code block, briefly explain what you built.",
    "",
    "Available skills:",
    skillSection,
  ].join("\n");
}
