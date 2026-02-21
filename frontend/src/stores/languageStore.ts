import { create } from 'zustand';

type Language = 'th' | 'en';

type Translations = {
  [key in Language]: Record<string, string>;
};

const translations: Translations = {
  th: {
    // General
    "app.title": "POS Online",
    "common.loading": "กำลังโหลด...",
    "common.save": "บันทึก",
    "common.cancel": "ยกเลิก",
    "common.delete": "ลบ",
    "common.edit": "แก้ไข",
    "common.add": "เพิ่ม",
    "common.search": "ค้นหา...",
    
    // Sidebar
    "nav.pos": "POS",
    "nav.products": "สินค้า",
    "nav.costcalculator": "ต้นทุน",
    "nav.history": "ประวัติ",
    "nav.dashboard": "แดชบอร์ด",
    "nav.members": "สมาชิก",
    "nav.promotions": "โปรโมชั่น",
    "nav.users": "ผู้ใช้งาน",
    "nav.settings": "ตั้งค่า",
    "nav.logout": "ออก",
    "nav.darkMode": "โหมดมืด",
    "nav.lightMode": "โหมดสว่าง",
    "nav.language": "ภาษา",

    // Products Page
    "products.title": "จัดการสินค้า",
    "products.itemsCount": "รายการ",
    "products.addProduct": "เพิ่มสินค้า",
    "products.searchPlaceholder": "ค้นหาสินค้า ชื่อ / SKU / บาร์โค้ด...",
    "products.filterAll": "ทั้งหมด",
    "products.manageCategories": "จัดการหมวดหมู่",
    "products.table.product": "สินค้า",
    "products.table.sku": "SKU",
    "products.table.category": "หมวดหมู่",
    "products.table.price": "ราคาขาย",
    "products.table.cost": "ต้นทุน",
    "products.table.profit": "กำไร",
    "products.table.stock": "คงเหลือ",
    "products.table.actions": "จัดการ",
    "products.notFound": "ไม่พบสินค้าที่ค้นหา",
    "products.form.add": "เพิ่มสินค้าใหม่",
    "products.form.edit": "แก้ไขสินค้า",
    "products.form.category": "หมวดหมู่ *",
    "products.form.selectCategory": "เลือกหมวดหมู่",
    "products.form.image": "รูปภาพ (JPG, PNG ไม่เกิน 2MB)",
    "products.form.name": "ชื่อสินค้า *",
    "products.form.sku": "SKU *",
    "products.form.price": "ราคาขาย (บาท) *",
    "products.form.cost": "ต้นทุน (บาท)",
    "products.form.stock": "จำนวนสต็อก",
    "products.form.barcode": "บาร์โค้ด",
    "products.form.profitPerItem": "กำไรต่อชิ้น",
    "products.form.profitMargin": "อัตรากำไร",
    "products.category.title": "จัดการหมวดหมู่สินค้า",
    "products.category.add": "เพิ่มหมวดหมู่ใหม่",
    "products.category.edit": "แก้ไขหมวดหมู่",
    "products.category.namePlaceholder": "ชื่อหมวดหมู่...",
    "products.category.addBtn": "เพิ่มหมวดหมู่",
    "products.delete.title": "ยืนยันการลบ",
    "products.delete.desc": "ต้องการลบ",
    "products.delete.confirm": "หรือไม่?",
    "products.delete.warning": "การดำเนินการนี้ไม่สามารถย้อนกลับได้",
    "products.delete.productBtn": "ลบสินค้า",
    "products.deleteCat.title": "ยืนยันการลบหมวดหมู่",
    "products.deleteCat.btn": "ลบข้อมูล",
    
    // POS Page
    "pos.title": "POS",
    "pos.subtitle": "ระบบขายหน้าร้าน",
    "pos.searchPlaceholder": "ค้นหาสินค้า / สแกนบาร์โค้ด...",
    "pos.filterAll": "ทั้งหมด",
    "pos.stock": "คงเหลือ",
    "pos.cart.title": "ตะกร้า",
    "pos.cart.items": "รายการ",
    "pos.cart.clear": "ล้างทั้งหมด",
    "pos.cart.empty": "ยังไม่มีสินค้าในตะกร้า",
    "pos.cart.emptyHint": "คลิกสินค้าเพื่อเพิ่ม",
    "pos.cart.subtotal": "ยอดรวม",
    "pos.cart.discount": "ส่วนลด",
    "pos.cart.tax": "ภาษี (7%)",
    "pos.cart.total": "ยอดชำระ",
    "pos.cart.checkout": "ชำระเงิน",
    "pos.checkout.title": "ชำระเงิน",
    "pos.checkout.amount": "ยอดที่ต้องชำระ",
    "pos.checkout.method": "ช่องทางการชำระเงิน",
    "pos.checkout.confirm": "ยืนยันการชำระเงิน",
    "pos.checkout.success": "ทำรายการสำเร็จ",
    "pos.checkout.successDesc": "บันทึกข้อมูลการขายเรียบร้อยแล้ว",

    // Roles
    "role.admin": "แอดมิน",
    "role.manager": "ผู้จัดการ",
    "role.cashier": "แคชเชียร์",
  },
  en: {
    // General
    "app.title": "POS Online",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.search": "Search...",
    
    // Sidebar
    "nav.pos": "POS",
    "nav.products": "Products",
    "nav.costcalculator": "Costs",
    "nav.history": "History",
    "nav.dashboard": "Dashboard",
    "nav.members": "Members",
    "nav.promotions": "Promotions",
    "nav.users": "Users",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    "nav.darkMode": "Dark Mode",
    "nav.lightMode": "Light Mode",
    "nav.language": "Language",

    // Products Page
    "products.title": "Products Management",
    "products.itemsCount": "Items",
    "products.addProduct": "Add Product",
    "products.searchPlaceholder": "Search by Name / SKU / Barcode...",
    "products.filterAll": "All",
    "products.manageCategories": "Manage Categories",
    "products.table.product": "Product",
    "products.table.sku": "SKU",
    "products.table.category": "Category",
    "products.table.price": "Price",
    "products.table.cost": "Cost",
    "products.table.profit": "Profit",
    "products.table.stock": "Stock",
    "products.table.actions": "Actions",
    "products.notFound": "No products found",
    "products.form.add": "Add New Product",
    "products.form.edit": "Edit Product",
    "products.form.category": "Category *",
    "products.form.selectCategory": "Select Category",
    "products.form.image": "Image (JPG/PNG max 2MB)",
    "products.form.name": "Product Name *",
    "products.form.sku": "SKU *",
    "products.form.price": "Selling Price *",
    "products.form.cost": "Cost",
    "products.form.stock": "Stock Quantity",
    "products.form.barcode": "Barcode",
    "products.form.profitPerItem": "Profit/Item",
    "products.form.profitMargin": "Margin",
    "products.category.title": "Manage Categories",
    "products.category.add": "Add New Category",
    "products.category.edit": "Edit Category",
    "products.category.namePlaceholder": "Category Name...",
    "products.category.addBtn": "Add Category",
    "products.delete.title": "Confirm Deletion",
    "products.delete.desc": "Are you sure you want to delete",
    "products.delete.confirm": "?",
    "products.delete.warning": "This action cannot be undone.",
    "products.delete.productBtn": "Delete Product",
    "products.deleteCat.title": "Confirm Category Deletion",
    "products.deleteCat.btn": "Delete Data",

    // POS Page
    "pos.title": "POS",
    "pos.subtitle": "Point of Sale",
    "pos.searchPlaceholder": "Search products / Scan barcode...",
    "pos.filterAll": "All",
    "pos.stock": "Stock",
    "pos.cart.title": "Cart",
    "pos.cart.items": "Items",
    "pos.cart.clear": "Clear All",
    "pos.cart.empty": "Cart is empty",
    "pos.cart.emptyHint": "Click products to add to cart",
    "pos.cart.subtotal": "Subtotal",
    "pos.cart.discount": "Discount",
    "pos.cart.tax": "Tax (7%)",
    "pos.cart.total": "Total",
    "pos.cart.checkout": "Checkout",
    "pos.checkout.title": "Checkout",
    "pos.checkout.amount": "Amount to Pay",
    "pos.checkout.method": "Payment Method",
    "pos.checkout.confirm": "Confirm Payment",
    "pos.checkout.success": "Transaction Successful",
    "pos.checkout.successDesc": "Sales record saved successfully",

    // Roles
    "role.admin": "Admin",
    "role.manager": "Manager",
    "role.cashier": "Cashier",
  }
};

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: 'th', // Default to Thai
  setLanguage: (lang) => set({ language: lang }),
  toggleLanguage: () => set((state) => ({ language: state.language === 'th' ? 'en' : 'th' })),
  t: (key: string) => {
    const { language } = get();
    return translations[language][key] || key;
  },
}));
