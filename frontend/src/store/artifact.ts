import { create } from "zustand";

interface ArtifactStore {
  code: string;
  isStreaming: boolean;
  setCode: (code: string) => void;
  setStreaming: (v: boolean) => void;
  clear: () => void;
}

export const useArtifactStore = create<ArtifactStore>((set) => ({
  code: "",
  isStreaming: false,
  setCode: (code) => set({ code }),
  setStreaming: (v) => set({ isStreaming: v }),
  clear: () => set({ code: "" }),
}));
