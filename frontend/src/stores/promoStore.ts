import { create } from 'zustand';
import api from '../lib/api';

export type ConditionType = 'MIN_CART_TOTAL' | 'MIN_ITEM_QTY' | 'SPECIFIC_ITEM' | 'SPECIFIC_CATEGORY';
export type RewardType = 'DISCOUNT_AMOUNT' | 'DISCOUNT_PERCENT' | 'FIXED_PRICE' | 'FREE_ITEM';

export interface PromotionCondition {
  id?: string;
  type: ConditionType;
  productId?: string;
  categoryId?: string;
  value?: number;
}

export interface PromotionReward {
  id?: string;
  type: RewardType;
  productId?: string;
  value: number;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  conditions: PromotionCondition[];
  rewards: PromotionReward[];
}

interface PromoStore {
  promotions: Promotion[];
  fetchPromotions: () => Promise<void>;
  addPromotion: (promo: Omit<Promotion, 'id' | 'createdAt' | 'usedCount'>) => Promise<boolean>;
  updatePromotion: (id: string, data: Partial<Promotion>) => Promise<boolean>;
  deletePromotion: (id: string) => Promise<boolean>;
}

export const usePromoStore = create<PromoStore>((set, get) => ({
  promotions: [],
  fetchPromotions: async () => {
    try {
      const res = await api.get('/promotions');
      set({ promotions: res.data });
    } catch (e) {
      console.error(e);
    }
  },
  addPromotion: async (promo) => {
    try {
      const res = await api.post('/promotions', promo);
      set({ promotions: [...get().promotions, res.data] });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  updatePromotion: async (id, data) => {
    try {
      const res = await api.patch(`/promotions/${id}`, data);
      set({ promotions: get().promotions.map((p) => p.id === id ? res.data : p) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  deletePromotion: async (id) => {
    try {
      await api.delete(`/promotions/${id}`);
      set({ promotions: get().promotions.filter((p) => p.id !== id) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}));
