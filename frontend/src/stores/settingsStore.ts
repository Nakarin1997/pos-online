import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface SettingsState {
  promptPayId: string;
  pointsPerThb: number;
  pointExpiryDays: number;
  signupBonus: number;
  setPromptPayId: (id: string) => void;
  fetchSettings: () => Promise<void>;
  updateBackendSettings: (updates: Record<string, string>) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      promptPayId: '0812345678', // Default fallback
      pointsPerThb: 100,
      pointExpiryDays: 365,
      signupBonus: 50,
      setPromptPayId: (id) => set({ promptPayId: id }),
      fetchSettings: async () => {
        try {
          const res = await api.get('/settings');
          const data = res.data;
          set({
            pointsPerThb: parseInt(data.POINTS_PER_THB, 10) || 100,
            pointExpiryDays: parseInt(data.POINT_EXPIRY_DAYS, 10) || 365,
            signupBonus: parseInt(data.SIGNUP_BONUS_POINTS, 10) || 50,
          });
        } catch (error) {
          console.error('Failed to fetch settings:', error);
        }
      },
      updateBackendSettings: async (updates: Record<string, string>) => {
        try {
          await api.patch('/settings', updates);
          await get().fetchSettings();
          return true;
        } catch (error) {
          console.error('Failed to update settings:', error);
          return false;
        }
      },
    }),
    {
      name: 'pos-settings', // saved in localStorage
    }
  )
);
