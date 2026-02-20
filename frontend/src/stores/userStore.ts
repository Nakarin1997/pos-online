import { create } from 'zustand';
import type { UserRole } from './authStore';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const initialUsers: User[] = [
  { id: 'u1', name: 'Admin', email: 'admin@pos.com', role: 'ADMIN', password: 'admin123', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'u2', name: 'แคชเชียร์ สมชาย', email: 'cashier@pos.com', role: 'CASHIER', password: 'cashier123', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'u3', name: 'ผู้จัดการ สมหญิง', email: 'manager@pos.com', role: 'MANAGER', password: 'manager123', status: 'ACTIVE', createdAt: new Date().toISOString() },
];

interface UserStore {
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  users: initialUsers,
  addUser: (user) => set((state) => ({
    users: [...state.users, { ...user, id: `u${Date.now()}`, createdAt: new Date().toISOString() }]
  })),
  updateUser: (id, data) => set((state) => ({
    users: state.users.map((u) => u.id === id ? { ...u, ...data } : u)
  })),
  deleteUser: (id) => set((state) => ({
    users: state.users.filter((u) => u.id !== id)
  })),
}));
