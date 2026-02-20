import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'CASHIER' | 'MANAGER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

import { useUserStore } from './userStore';
interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,

  login: (email, password) => {
    const users = useUserStore.getState().users;
    const found = users.find(
      (u) => u.email === email && u.password === password && u.status === 'ACTIVE'
    );
    if (found) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...user } = found;
      set({ user, isAuthenticated: true, error: null });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_user', JSON.stringify(user));
      }
      return true;
    }
    set({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    return false;
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, error: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_user');
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
