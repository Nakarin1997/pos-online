import { create } from 'zustand';
import api from '../lib/api';

export type MemberTier = 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Member {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: MemberTier;
  totalSpent: number;
  lastVisit: string | null;
  createdAt: string;
}

interface MemberStore {
  members: Member[];
  fetchMembers: () => Promise<void>;
  addMember: (member: Omit<Member, 'id' | 'points' | 'tier' | 'totalSpent' | 'lastVisit' | 'createdAt'>) => Promise<boolean>;
  updateMember: (id: string, data: Partial<Member>) => Promise<boolean>;
  deleteMember: (id: string) => Promise<boolean>;
  addPoints: (id: string, pointsToAdd: number, spentToAdd: number) => Promise<boolean>;
}

export const useMemberStore = create<MemberStore>((set, get) => ({
  members: [],
  fetchMembers: async () => {
    try {
      const res = await api.get('/members');
      set({ members: res.data });
    } catch (e) {
      console.error(e);
    }
  },
  addMember: async (member) => {
    try {
      const res = await api.post('/members', member);
      set({ members: [...get().members, res.data] });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  updateMember: async (id, data) => {
    try {
      const res = await api.patch(`/members/${id}`, data);
      set({ members: get().members.map((m) => (m.id === id ? res.data : m)) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  deleteMember: async (id) => {
    try {
      await api.delete(`/members/${id}`);
      set({ members: get().members.filter((m) => m.id !== id) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  addPoints: async (id, pointsToAdd, spentToAdd) => {
    try {
      const m = get().members.find(x => x.id === id);
      if (!m) return false;
      
      const newTotalSpent = Number(m.totalSpent || 0) + spentToAdd;
      let newTier: MemberTier = m.tier;
      if (newTotalSpent > 50000) newTier = 'PLATINUM';
      else if (newTotalSpent > 20000) newTier = 'GOLD';
      else if (newTotalSpent > 5000) newTier = 'SILVER';
      
      const updateData = {
        points: Number(m.points || 0) + pointsToAdd,
        totalSpent: newTotalSpent,
        tier: newTier,
        lastVisit: new Date().toISOString()
      };
      
      const res = await api.patch(`/members/${id}`, updateData);
      set({ members: get().members.map(x => x.id === id ? res.data : x) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}));
