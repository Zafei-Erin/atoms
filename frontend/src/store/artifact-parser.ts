export type ArtifactChoice = {
  id: "1" | "2";
  code: string;
};

export type ParsedArtifact =
  | { mode: "empty" }
  | { mode: "choices"; choices: ArtifactChoice[] }
  | { mode: "final"; code: string };

type ParseArtifactOptions = {
  stage?: "proposals" | "final";
};

const HTML_BLOCK_RE = /```html[^\n\r]*\r?\n([\s\S]*?)(?:```|$)/gi;

export function parseArtifactFromText(
  text: string,
  options: ParseArtifactOptions = {},
): ParsedArtifact {
  const blocks = Array.from(text.matchAll(HTML_BLOCK_RE))
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean);

  if (blocks.length >= 2) {
    return {
      mode: "choices",
      choices: blocks.slice(0, 2).map((code, index) => ({
        id: String(index + 1) as "1" | "2",
        code,
      })),
    };
  }

  if (blocks.length === 1) {
    if (options.stage !== "final") {
      return {
        mode: "choices",
        choices: [{ id: "1", code: blocks[0] }],
      };
    }

    return {
      mode: "final",
      code: blocks[0],
    };
  }

  return { mode: "empty" };
}

export function getChoiceFromUserText(text: string): "1" | "2" | null {
  const normalized = text.trim();
  return normalized === "1" || normalized === "2" ? normalized : null;
}
