import { create } from "zustand";
import type { ArtifactChoice, ParsedArtifact } from "./artifact-parser";

interface ArtifactStore {
  mode: "empty" | "choices" | "final";
  code: string;
  choices: ArtifactChoice[];
  selectedChoiceId: "1" | "2" | null;
  isStreaming: boolean;
  setCode: (code: string) => void;
  setChoices: (choices: ArtifactChoice[]) => void;
  selectChoice: (choiceId: "1" | "2") => void;
  hydrateFromParsed: (artifact: ParsedArtifact) => void;
  setStreaming: (v: boolean) => void;
  clear: () => void;
}

export const useArtifactStore = create<ArtifactStore>((set) => ({
  mode: "empty",
  code: "",
  choices: [],
  selectedChoiceId: null,
  isStreaming: false,
  setCode: (code) => set({ mode: "final", code, choices: [], selectedChoiceId: null }),
  setChoices: (choices) =>
    set({
      mode: "choices",
      choices,
      code: "",
      selectedChoiceId: null,
    }),
  selectChoice: (choiceId) =>
    set((state) => {
      const selected = state.choices.find((choice) => choice.id === choiceId);
      if (!selected) return state;
      return {
        mode: "final",
        code: selected.code,
        selectedChoiceId: choiceId,
      };
    }),
  hydrateFromParsed: (artifact) =>
    set(() => {
      if (artifact.mode === "choices") {
        return {
          mode: "choices",
          code: "",
          choices: artifact.choices,
          selectedChoiceId: null,
        };
      }

      if (artifact.mode === "final") {
        return {
          mode: "final",
          code: artifact.code,
          choices: [],
          selectedChoiceId: null,
        };
      }

      return {
        mode: "empty",
        code: "",
        choices: [],
        selectedChoiceId: null,
      };
    }),
  setStreaming: (v) => set({ isStreaming: v }),
  clear: () =>
    set({
      mode: "empty",
      code: "",
      choices: [],
      selectedChoiceId: null,
      isStreaming: false,
    }),
}));
