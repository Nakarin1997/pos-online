import { create } from 'zustand';
import { Order } from '@/types';
import api from '../lib/api';

interface CreateOrderPayload {
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  discount?: number;
  paymentMethod: string;
  note?: string;
  userId: string;
  memberId?: string;
  promoId?: string;
}

interface OrderStore {
  orders: Order[];
  fetchOrders: () => Promise<void>;
  addOrder: (payload: CreateOrderPayload) => Promise<Order | null>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  fetchOrders: async () => {
    try {
      const res = await api.get('/orders');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedOrders = res.data.map((order: any) => ({
        ...order,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: order.items?.map((item: any) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })) || []
      }));
      set({ orders: processedOrders });
    } catch (e) {
      console.error(e);
    }
  },
  addOrder: async (payload) => {
    try {
      const res = await api.post('/orders', payload);
      const rawOrder = res.data;
      const newOrder = {
        ...rawOrder,
        subtotal: Number(rawOrder.subtotal),
        discount: Number(rawOrder.discount),
        tax: Number(rawOrder.tax),
        total: Number(rawOrder.total),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: rawOrder.items?.map((item: any) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })) || []
      };
      set({ orders: [newOrder, ...get().orders] });
      return newOrder;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}));
