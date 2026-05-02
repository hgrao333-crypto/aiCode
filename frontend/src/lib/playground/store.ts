import { create } from "zustand";

type PlaygroundState = {
  files: Record<string, string>;
  setFile: (path: string, content: string) => void;
  setAll: (files: Record<string, string>) => void;
  revealedHints: string[];
  revealHint: (id: string) => void;
  startMs: number;
  setStart: (ms: number) => void;
  reset: () => void;
};

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  files: {},
  setFile: (path, content) =>
    set((s) => ({ files: { ...s.files, [path]: content } })),
  setAll: (files) => set({ files }),
  revealedHints: [],
  revealHint: (id) =>
    set((s) =>
      s.revealedHints.includes(id)
        ? s
        : { revealedHints: [...s.revealedHints, id] }
    ),
  startMs: 0,
  setStart: (ms) => set({ startMs: ms }),
  reset: () => set({ files: {}, revealedHints: [], startMs: 0 }),
}));
