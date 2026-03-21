import { SkillLoader } from "../../../lib/skills/skill-loader";

const skillLoader = new SkillLoader();

export async function listAvailableSkills() {
  return skillLoader.listSkills();
}

export function createLoadSkillToolDefinition() {
  return {
    type: "function" as const,
    function: {
      name: "load_skill",
      description:
        "Load a skill by name to get its full SKILL.md instructions and usage details.",
      parameters: {
        type: "object",
        properties: {
          skill_name: {
            type: "string",
            description:
              "The skill name to load, usually matching one of the available skills listed in the system prompt.",
          },
        },
        required: ["skill_name"],
        additionalProperties: false,
      },
    },
  };
}

export function parseLoadSkillArgs(input: string) {
  const parsed = JSON.parse(input) as { skill_name?: string };
  if (!parsed.skill_name?.trim()) {
    throw new Error("skill_name is required");
  }
  return { skill_name: parsed.skill_name.trim() };
}

export async function executeLoadSkill(args: { skill_name: string }) {
  console.log("[agent] loading skill:", args.skill_name);
  return skillLoader.loadSkill(args.skill_name);
}
