import { create } from 'zustand';
import { Product, Category } from '@/types';

// Demo categories
const demoCategories: Category[] = [
  { id: "1", name: "อาหาร", color: "#22c55e", isActive: true },
  { id: "2", name: "เครื่องดื่ม", color: "#3b82f6", isActive: true },
  { id: "3", name: "ขนม", color: "#f59e0b", isActive: true },
  { id: "4", name: "ของใช้", color: "#ef4444", isActive: true },
];

const demoProducts: Product[] = [
  { id: "p1", name: "ข้าวผัดกระเพรา", sku: "FOOD-001", barcode: "8850001", price: 60, cost: 30, stock: 50, isActive: true, categoryId: "1", category: demoCategories[0] },
  { id: "p2", name: "ข้าวมันไก่", sku: "FOOD-002", barcode: "8850002", price: 55, cost: 25, stock: 40, isActive: true, categoryId: "1", category: demoCategories[0] },
  { id: "p3", name: "ผัดไทย", sku: "FOOD-003", barcode: "8850003", price: 65, cost: 30, stock: 35, isActive: true, categoryId: "1", category: demoCategories[0] },
  { id: "p4", name: "ส้มตำ", sku: "FOOD-004", barcode: "8850004", price: 50, cost: 20, stock: 30, isActive: true, categoryId: "1", category: demoCategories[0] },
  { id: "p5", name: "น้ำเปล่า", sku: "BEV-001", barcode: "8850005", price: 10, cost: 5, stock: 100, isActive: true, categoryId: "2", category: demoCategories[1] },
  { id: "p6", name: "ชาเย็น", sku: "BEV-002", barcode: "8850006", price: 35, cost: 12, stock: 80, isActive: true, categoryId: "2", category: demoCategories[1] },
  { id: "p7", name: "กาแฟเย็น", sku: "BEV-003", barcode: "8850007", price: 45, cost: 15, stock: 60, isActive: true, categoryId: "2", category: demoCategories[1] },
  { id: "p8", name: "น้ำส้ม", sku: "BEV-004", barcode: "8850008", price: 25, cost: 10, stock: 70, isActive: true, categoryId: "2", category: demoCategories[1] },
  { id: "p9", name: "ขนมปัง", sku: "SNK-001", barcode: "8850009", price: 30, cost: 15, stock: 45, isActive: true, categoryId: "3", category: demoCategories[2] },
  { id: "p10", name: "เค้กช็อกโกแลต", sku: "SNK-002", barcode: "8850010", price: 80, cost: 35, stock: 20, isActive: true, categoryId: "3", category: demoCategories[2] },
  { id: "p11", name: "คุกกี้", sku: "SNK-003", barcode: "8850011", price: 40, cost: 18, stock: 35, isActive: true, categoryId: "3", category: demoCategories[2] },
  { id: "p12", name: "สบู่", sku: "GEN-001", barcode: "8850012", price: 45, cost: 20, stock: 25, isActive: true, categoryId: "4", category: demoCategories[3] },
  { id: "p13", name: "แชมพู", sku: "GEN-002", barcode: "8850013", price: 89, cost: 40, stock: 15, isActive: true, categoryId: "4", category: demoCategories[3] },
  { id: "p14", name: "ยาสีฟัน", sku: "GEN-003", barcode: "8850014", price: 55, cost: 25, stock: 30, isActive: true, categoryId: "4", category: demoCategories[3] },
  { id: "p15", name: "กระดาษ A4", sku: "GEN-004", barcode: "8850015", price: 120, cost: 60, stock: 10, isActive: true, categoryId: "4", category: demoCategories[3] },
];

interface ProductStore {
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'category'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  generateNextSku: (categoryId: string) => string;
  deductStock: (id: string, quantity: number) => void;

  /* Category Management */
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

let nextId = 16;
let nextCatId = 5;

const getCategoryPrefix = (categoryId: string) => {
  const map: Record<string, string> = {
    "1": "FOOD",
    "2": "BEV",
    "3": "SNK",
    "4": "GEN",
  };
  return map[categoryId] || `CAT${categoryId.padStart(2, '0')}`;
};

export const useProductStore = create<ProductStore>((set, get) => ({
  products: demoProducts,
  categories: demoCategories,

  addProduct: (productData) => {
    const category = get().categories.find(c => c.id === productData.categoryId);
    const newProduct: Product = {
      ...productData,
      id: `p${nextId++}`,
      category,
    };
    set((state) => ({
      products: [...state.products, newProduct],
    }));
  },

  updateProduct: (id, data) => {
    set((state) => ({
      products: state.products.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...data };
        if (data.categoryId) {
          updated.category = get().categories.find(c => c.id === data.categoryId);
        }
        return updated;
      }),
    }));
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
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
      }),
    }));
  },

  generateNextSku: (categoryId) => {
    if (!categoryId) return "";
    const prefix = getCategoryPrefix(categoryId);
    const existingSkus = get()
      .products.filter((p) => p.sku.startsWith(prefix))
      .map((p) => {
        const parts = p.sku.split("-");
        return parts.length === 2 ? parseInt(parts[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const nextNum = existingSkus.length > 0 ? Math.max(...existingSkus) + 1 : 1;
    return `${prefix}-${nextNum.toString().padStart(3, "0")}`;
  },

  addCategory: (categoryData) => {
    const newCategory: Category = {
      ...categoryData,
      id: String(nextCatId++),
    };
    set((state) => ({
      categories: [...state.categories, newCategory],
    }));
  },

  updateCategory: (id, data) => {
    set((state) => {
      // Update category list
      const updatedCategories = state.categories.map((c) => 
        c.id === id ? { ...c, ...data } : c
      );
      
      // Cascade update to products that reference this category
      const updatedProducts = state.products.map((p) => {
        if (p.categoryId === id) {
          return { ...p, category: updatedCategories.find(c => c.id === id) };
        }
        return p;
      });

      return {
        categories: updatedCategories,
        products: updatedProducts,
      };
    });
  },

  deleteCategory: (id) => {
    set((state) => {
      // Check if products are still tied to this category
      const hasProducts = state.products.some(p => p.categoryId === id);
      if (hasProducts) {
        alert("ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากยังมีสินค้าที่ใช้งานอยู่");
        return state;
      }
      return {
        categories: state.categories.filter((c) => c.id !== id),
      };
    });
  },
}));
