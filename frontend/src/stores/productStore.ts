import { create } from 'zustand';
import { Product, Category } from '@/types';
import api from '../lib/api';

interface ProductStore {
  products: Product[];
  categories: Category[];
  
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  
  addProduct: (product: Omit<Product, 'id' | 'category' | 'sku'> & { sku?: string }) => Promise<boolean>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  getProductById: (id: string) => Product | undefined;
  generateNextSku: (categoryId: string) => string;
  deductStock: (id: string, quantity: number) => void;

  /* Category Management */
  addCategory: (category: Omit<Category, 'id'>) => Promise<boolean>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
}

const getCategoryPrefix = (categoryId: string, categories: Category[]) => {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return 'GEN';
  // Example mapping
  const map: Record<string, string> = {
    "1": "FOOD",
    "2": "BEV",
    "3": "SNK",
    "4": "GEN",
  };
  return map[categoryId] || `CAT${categoryId.substring(0,2).toUpperCase()}`;
};

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  categories: [],

  fetchProducts: async () => {
    try {
      const res = await api.get('/products');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedProducts = res.data.map((p: any) => ({
        ...p,
        price: Number(p.price),
        cost: Number(p.cost),
      }));
      set({ products: parsedProducts });
    } catch (e) {
      console.error(e);
    }
  },

  fetchCategories: async () => {
    try {
      const res = await api.get('/categories');
      set({ categories: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  addProduct: async (productData) => {
    try {
      const skuToUse = productData.sku || get().generateNextSku(productData.categoryId);
      const res = await api.post('/products', { ...productData, sku: skuToUse });
      const parsedProduct = {
        ...res.data,
        price: Number(res.data.price),
        cost: Number(res.data.cost),
      };
      set({ products: [...get().products, parsedProduct] });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  updateProduct: async (id, data) => {
    try {
      const res = await api.patch(`/products/${id}`, data);
      const parsedProduct = {
        ...res.data,
        price: Number(res.data.price),
        cost: Number(res.data.cost),
      };
      set({ products: get().products.map((p) => p.id === id ? parsedProduct : p) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  deleteProduct: async (id) => {
    try {
      await api.delete(`/products/${id}`);
      set({ products: get().products.filter((p) => p.id !== id) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },

  deductStock: (id, quantity) => {
    set((state) => ({
      products: state.products.map((p) => {
        if (p.id === id) {
          return { ...p, stock: Math.max(0, p.stock - quantity) };
        }
        return p;
      })
    }));
  },

  generateNextSku: (categoryId) => {
    const prefix = getCategoryPrefix(categoryId, get().categories);
    const categoryProducts = get().products.filter(p => p.categoryId === categoryId);
    
    let maxNum = 0;
    categoryProducts.forEach(p => {
      const numPart = p.sku.replace(prefix, '').replace('-', '');
      const num = parseInt(numPart);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    });

    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}-${nextNum}`;
  },

  addCategory: async (category) => {
    try {
      // Ignore color field for backend if it doesn't support it, but Prisma schema has color
      const res = await api.post('/categories', category);
      set({ categories: [...get().categories, res.data] });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  updateCategory: async (id, data) => {
    try {
      const res = await api.patch(`/categories/${id}`, data);
      set({ categories: get().categories.map((c) => c.id === id ? res.data : c) });
      
      // Update the category inside products too
      set((state) => ({
        products: state.products.map(p => {
          if (p.categoryId === id) {
            return { ...p, category: res.data };
          }
          return p;
        })
      }));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      set({ categories: get().categories.filter((c) => c.id !== id) });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
}));
