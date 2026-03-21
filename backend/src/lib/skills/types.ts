export type SkillSummary = {
  name: string;
  description: string;
  filePath: string;
};

export type SkillRecord = SkillSummary & {
  content: string;
  aliases: string[];
};

