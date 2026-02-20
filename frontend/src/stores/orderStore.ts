import { create } from 'zustand';
import { Order, Product } from '@/types';

const demoOrders: Order[] = [
  {
    id: "o1", orderNumber: "ORD-20260220-0001", subtotal: 180, discount: 0, tax: 12.6, total: 192.6,
    paymentMethod: "CASH", status: "COMPLETED", userId: "u1",
    user: { id: "u1", name: "Admin" },
    items: [
      { id: "i1", productId: "p1", quantity: 2, unitPrice: 60, subtotal: 120, product: { id: "p1", name: "ข้าวผัดกระเพรา", sku: "FOOD-001", price: 60, cost: 30, stock: 50, isActive: true, categoryId: "1" } as unknown as Product },
      { id: "i2", productId: "p5", quantity: 2, unitPrice: 30, subtotal: 60, product: { id: "p5", name: "ขนมปัง", sku: "SNK-001", price: 30, cost: 15, stock: 45, isActive: true, categoryId: "3" } as unknown as Product },
    ],
    createdAt: "2026-02-20T10:30:00Z",
  },
  {
    id: "o2", orderNumber: "ORD-20260220-0002", subtotal: 95, discount: 10, tax: 5.95, total: 90.95,
    paymentMethod: "PROMPTPAY", status: "COMPLETED", userId: "u1",
    user: { id: "u1", name: "Admin" },
    items: [
      { id: "i3", productId: "p2", quantity: 1, unitPrice: 55, subtotal: 55, product: { id: "p2", name: "ข้าวมันไก่", sku: "FOOD-002", price: 55, cost: 25, stock: 40, isActive: true, categoryId: "1" } as unknown as Product },
      { id: "i4", productId: "p7", quantity: 1, unitPrice: 40, subtotal: 40, product: { id: "p7", name: "คุกกี้", sku: "SNK-003", price: 40, cost: 18, stock: 35, isActive: true, categoryId: "3" } as unknown as Product },
    ],
    createdAt: "2026-02-20T11:15:00Z",
  },
  {
    id: "o3", orderNumber: "ORD-20260220-0003", subtotal: 135, discount: 0, tax: 9.45, total: 144.45,
    paymentMethod: "CREDIT_CARD", status: "CANCELLED", userId: "u1",
    user: { id: "u1", name: "Admin" },
    items: [
      { id: "i5", productId: "p6", quantity: 3, unitPrice: 45, subtotal: 135, product: { id: "p6", name: "สบู่", sku: "GEN-001", price: 45, cost: 20, stock: 25, isActive: true, categoryId: "4" } as unknown as Product },
    ],
    createdAt: "2026-02-20T14:00:00Z",
  },
];

interface OrderStore {
  orders: Order[];
  addOrder: (order: Order) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: demoOrders,
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
}));
