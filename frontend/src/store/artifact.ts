import { create } from "zustand";

interface ArtifactStore {
  code: string;
  setCode: (code: string) => void;
  clear: () => void;
}

export const useArtifactStore = create<ArtifactStore>((set) => ({
  code: "",
  setCode: (code) => set({ code }),
  clear: () => set({ code: "" }),
}));
