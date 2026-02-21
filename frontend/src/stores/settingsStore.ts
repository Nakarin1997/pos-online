import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  promptPayId: string;
  pointsPerThb: number;
  pointExpiryDays: number;
  signupBonus: number;
  setPromptPayId: (id: string) => void;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      promptPayId: '0812345678', // Default fallback
      pointsPerThb: 100,
      pointExpiryDays: 365,
      signupBonus: 50,
      setPromptPayId: (id) => set({ promptPayId: id }),
      fetchSettings: async () => {
        try {
          const res = await fetch('http://localhost:3001/settings');
          const data = await res.json();
          set({
            pointsPerThb: parseInt(data.POINTS_PER_THB, 10) || 100,
            pointExpiryDays: parseInt(data.POINT_EXPIRY_DAYS, 10) || 365,
            signupBonus: parseInt(data.SIGNUP_BONUS_POINTS, 10) || 50,
          });
        } catch (error) {
          console.error('Failed to fetch settings:', error);
        }
      },
    }),
    {
      name: 'pos-settings', // saved in localStorage
    }
  )
);
