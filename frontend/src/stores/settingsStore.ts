import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  promptPayId: string;
  setPromptPayId: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      promptPayId: '0812345678', // Default fallback
      setPromptPayId: (id) => set({ promptPayId: id }),
    }),
    {
      name: 'pos-settings', // saved in localStorage
    }
  )
);
