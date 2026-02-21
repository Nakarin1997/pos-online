import { create } from 'zustand';
import { CartItem, Product, PaymentMethod } from '@/types';

interface CartStore {
  items: CartItem[];
  discount: number;
  paymentMethod: PaymentMethod;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: 'CASH',

  addItem: (product: Product) => {
    set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    });
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    }));
  },

  setDiscount: (discount: number) => set({ discount }),
  setPaymentMethod: (method: PaymentMethod) => set({ paymentMethod: method }),

  clearCart: () => set({ items: [], discount: 0, paymentMethod: 'CASH' }),

  getSubtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  },

  getTax: () => {
    const total = get().getTotal();
    // VAT 7% included in price: VAT = Total - (Total / 1.07)
    return total - (total / 1.07);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    // Total is simply Subtotal minus Discount because prices already include VAT
    return subtotal - discount;
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
