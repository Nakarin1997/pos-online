import { create } from 'zustand';
import type { UserRole } from './authStore';
import api from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  isActive: boolean;
  createdAt: string;
}

interface UserStore {
  users: User[];
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'isActive'>) => Promise<boolean>;
  updateUser: (id: string, user: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  fetchUsers: async () => {
    try {
      const res = await api.get('/users');
      set({ users: res.data });
    } catch (e) {
      console.error(e);
    }
  },
  addUser: async (user) => {
    try {
      const res = await api.post('/users', user);
      set({ users: [...get().users, res.data] });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  updateUser: async (id, data) => {
    try {
      const res = await api.patch(`/users/${id}`, data);
      set({ users: get().users.map((u) => (u.id === id ? res.data : u)) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  deleteUser: async (id) => {
    try {
      await api.delete(`/users/${id}`);
      set({ users: get().users.filter((u) => u.id !== id) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
}));
