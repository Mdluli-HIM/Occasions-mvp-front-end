import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Mode = "planning" | "providing";

type ModeState = {
  mode: Mode;
  setMode: (mode: Mode) => void;
};

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: "planning",
      setMode: (mode) => set({ mode }),
    }),
    { name: "occasions-mode" }
  )
);
