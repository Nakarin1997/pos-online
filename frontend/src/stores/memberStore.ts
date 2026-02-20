import { create } from 'zustand';

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

const initialMembers: Member[] = [
  { id: 'm1', name: 'ลูกค้าทั่วไป 1', phone: '0812345678', points: 150, tier: 'SILVER', totalSpent: 5000, lastVisit: new Date().toISOString(), createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'm2', name: 'Somchai Jaidee', phone: '0898765432', points: 45, tier: 'BASIC', totalSpent: 1200, lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
];

interface MemberStore {
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'points' | 'tier' | 'totalSpent' | 'lastVisit' | 'createdAt'>) => void;
  updateMember: (id: string, data: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addPoints: (id: string, points: number, spent: number) => void;
}

export const useMemberStore = create<MemberStore>((set) => ({
  members: initialMembers,
  addMember: (member) => set((state) => ({
    members: [...state.members, { 
      ...member, 
      id: `m${Date.now()}`, 
      points: 0, 
      tier: 'BASIC', 
      totalSpent: 0, 
      lastVisit: null, 
      createdAt: new Date().toISOString() 
    }]
  })),
  updateMember: (id, data) => set((state) => ({
    members: state.members.map((m) => m.id === id ? { ...m, ...data } : m)
  })),
  deleteMember: (id) => set((state) => ({
    members: state.members.filter((m) => m.id !== id)
  })),
  addPoints: (id, pointsToAdd, spentToAdd) => set((state) => ({
    members: state.members.map((m) => {
      if (m.id === id) {
        const newTotalSpent = m.totalSpent + spentToAdd;
        // Simple tier logic
        let newTier: MemberTier = m.tier;
        if (newTotalSpent > 50000) newTier = 'PLATINUM';
        else if (newTotalSpent > 20000) newTier = 'GOLD';
        else if (newTotalSpent > 5000) newTier = 'SILVER';
        
        return { 
          ...m, 
          points: m.points + pointsToAdd, 
          totalSpent: newTotalSpent,
          tier: newTier,
          lastVisit: new Date().toISOString()
        };
      }
      return m;
    })
  }))
}));
