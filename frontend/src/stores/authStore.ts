import { create } from 'zustand';
import api from '../lib/api';

export type UserRole = 'ADMIN' | 'CASHIER' | 'MANAGER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      set({ user, isAuthenticated: true, error: null });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_token', access_token);
        localStorage.setItem('pos_user', JSON.stringify(user));
      }
      return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      return false;
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, error: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_user');
      localStorage.removeItem('pos_token');
    }
  },

  clearError: () => set({ error: null }),
}));

// Initialize from localStorage on client
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('pos_user');
  if (stored) {
    try {
      const user = JSON.parse(stored) as AuthUser;
      useAuthStore.setState({ user, isAuthenticated: true });
    } catch {}
  }
}
