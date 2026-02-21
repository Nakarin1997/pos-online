export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  stock: number;
  image?: string;
  isActive: boolean;
  categoryId: string;
  category?: Category;
  recipe?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  name: string;         // ชื่อวัตถุดิบ เช่น "หมูสับ", "ใบกระเพรา"
  buyUnit: string;      // หน่วยซื้อ (ราคาตาม) เช่น "กก.", "ลิตร", "ขวด"
  useUnit: string;      // หน่วยใช้ (ปริมาณที่ใส่) เช่น "กรัม", "มล.", "ช้อนโต๊ะ"
  pricePerUnit: number; // ราคาต่อหน่วยซื้อ เช่น 180 บาท/กก.
  quantityUsed: number; // ปริมาณที่ใช้ต่อจาน (ตามหน่วยใช้) เช่น 150 กรัม
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  cashReceived?: number;
  change?: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  note?: string;
  userId: string;
  user?: { id: string; name: string };
  memberId?: string;
  promoId?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DashboardSummary {
  todaySales: number;
  todayOrderCount: number;
  totalProducts: number;
  lowStockProducts: Product[];
  topProducts: Array<{ product: Product; totalSold: number }>;
  recentOrders: Order[];
}

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'TRANSFER' | 'PROMPTPAY';
export type OrderStatus = 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
