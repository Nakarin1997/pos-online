import { create } from 'zustand';

export type PromoType = 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT';

export interface Promotion {
  id: string;
  name: string;
  type: PromoType;
  value: number; // For percent (e.g., 10 for 10%), for amount (e.g., 50 for 50฿)
  minSpend: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const initialPromotions: Promotion[] = [
  { id: 'p1', name: 'ลด 10% เมื่อซื้อครบ 500฿', type: 'DISCOUNT_PERCENT', value: 10, minSpend: 500, status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'p2', name: 'ส่วนลด 50฿ ท้ายบิล', type: 'DISCOUNT_AMOUNT', value: 50, minSpend: 300, status: 'ACTIVE', createdAt: new Date().toISOString() },
];

interface PromoStore {
  promotions: Promotion[];
  addPromotion: (promo: Omit<Promotion, 'id' | 'createdAt'>) => void;
  updatePromotion: (id: string, data: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
}

export const usePromoStore = create<PromoStore>((set) => ({
  promotions: initialPromotions,
  addPromotion: (promo) => set((state) => ({
    promotions: [...state.promotions, { 
      ...promo, 
      id: `p${Date.now()}`, 
      createdAt: new Date().toISOString() 
    }]
  })),
  updatePromotion: (id, data) => set((state) => ({
    promotions: state.promotions.map((p) => p.id === id ? { ...p, ...data } : p)
  })),
  deletePromotion: (id) => set((state) => ({
    promotions: state.promotions.filter((p) => p.id !== id)
  }))
}));
