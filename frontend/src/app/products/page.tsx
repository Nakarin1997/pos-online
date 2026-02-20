"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  X,
  AlertTriangle,
  Tags,
} from "lucide-react";
import { Product, Category } from "@/types";
import { useProductStore } from "@/stores/productStore";
import { useLanguageStore } from "@/stores/languageStore";

interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  price: string;
  cost: string;
  stock: string;
  categoryId: string;
  image?: string;
}

const emptyForm: ProductFormData = {
  name: "",
  sku: "",
  barcode: "",
  price: "",
  cost: "",
  stock: "",
  categoryId: "",
  image: "",
};

export default function ProductsPage() {
  const { products, categories, addProduct, updateProduct, deleteProduct, generateNextSku, addCategory, updateCategory, deleteCategory } = useProductStore();
  const { t } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [categoryData, setCategoryData] = useState({ name: "", color: "#22c55e" });
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<Category | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = filterCategory === "all" || p.categoryId === filterCategory;
    return matchSearch && matchCategory;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      categoryId: product.categoryId,
      image: product.image || "",
    });
    setShowForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('กรุณาอัปโหลดรูปภาพประเภท JPG หรือ PNG เท่านั้น');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.sku || !formData.price || !formData.categoryId) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        price: Number(formData.price),
        cost: Number(formData.cost) || 0,
        stock: Number(formData.stock) || 0,
        categoryId: formData.categoryId,
        image: formData.image || undefined,
      });
    } else {
      addProduct({
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        price: Number(formData.price),
        cost: Number(formData.cost) || 0,
        stock: Number(formData.stock) || 0,
        categoryId: formData.categoryId,
        image: formData.image || undefined,
        isActive: true,
      });
    }
    setShowForm(false);
    setEditingProduct(null);
    setFormData(emptyForm);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteProduct(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleCategorySubmit = () => {
    if (!categoryData.name) return;
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
    } else {
      addCategory({ name: categoryData.name, color: categoryData.color, isActive: true });
    }
    setCategoryData({ name: "", color: "#22c55e" });
    setEditingCategory(null);
  };

  const handleCategoryDelete = (cat: Category) => {
    const hasProducts = products.some(p => p.categoryId === cat.id);
    if (hasProducts) {
      alert("ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากยังมีสินค้าที่ใช้งานอยู่ กรุณาลบหรือย้ายสินค้าก่อน");
      return;
    }
    setDeleteCategoryConfirm(cat);
  };

  const confirmCategoryDelete = () => {
    if (deleteCategoryConfirm) {
      deleteCategory(deleteCategoryConfirm.id);
      setDeleteCategoryConfirm(null);
    }
  };

  const updateField = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      
      // Auto-generate SKU when category changes (only for new products)
      if (field === "categoryId" && !editingProduct) {
        if (value) {
          next.sku = generateNextSku(value);
        } else {
          next.sku = "";
        }
      }
      
      return next;
    });
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("products.title")}</h1>
          <p className="text-sm text-muted mt-1">{products.length} {t("products.itemsCount")}</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          style={{ boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)" }}
        >
          <Plus className="w-4 h-4" />
          {t("products.addProduct")}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder={t("products.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filterCategory === "all"
                ? "bg-primary text-white"
                : "glass text-muted hover:text-foreground"
            }`}
          >
            {t("products.filterAll")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filterCategory === cat.id
                  ? "text-white shadow-lg"
                  : "glass text-muted hover:text-foreground"
              }`}
              style={
                filterCategory === cat.id
                  ? { background: cat.color, boxShadow: `0 4px 15px ${cat.color}40` }
                  : {}
              }
            >
              {cat.name}
            </button>
          ))}
          <button
            onClick={() => setShowCategoryForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium glass text-muted hover:text-foreground hover:bg-surface-hover transition-all"
          >
            <Tags className="w-4 h-4" />
            {t("products.manageCategories")}
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">{t("products.table.product")}</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">{t("products.table.sku")}</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">{t("products.table.category")}</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">{t("products.table.price")}</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">{t("products.table.cost")}</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">{t("products.table.profit")}</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">{t("products.table.stock")}</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">{t("products.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const profit = product.price - product.cost;
              const margin = product.price > 0 ? (profit / product.price) * 100 : 0;
              return (
                <tr
                  key={product.id}
                  className="border-b border-border/50 hover:bg-surface-hover transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <div
                          className="w-10 h-10 rounded-lg bg-cover bg-center border border-border/50"
                          style={{ backgroundImage: `url(${product.image})` }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: `${product.category?.color}20` }}
                        >
                          <Package className="w-5 h-5" style={{ color: product.category?.color }} />
                        </div>
                      )}
                      <span className="font-medium text-sm text-foreground">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted font-mono">{product.sku}</td>
                  <td className="p-4">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: `${product.category?.color}20`,
                        color: product.category?.color,
                      }}
                    >
                      {product.category?.name}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm font-semibold text-foreground">
                    ฿{product.price.toFixed(2)}
                  </td>
                  <td className="p-4 text-right text-sm text-muted">
                    ฿{product.cost.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <div>
                      <span className="text-sm font-semibold text-success">฿{profit.toFixed(2)}</span>
                      <span className="text-xs text-muted ml-1">({margin.toFixed(0)}%)</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span
                      className={`text-sm font-semibold ${
                        product.stock < 10 ? "text-danger" : product.stock < 30 ? "text-warning" : "text-success"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-2 rounded-lg text-muted hover:text-primary hover:bg-surface transition-all"
                        title={t("common.edit")}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product)}
                        className="p-2 rounded-lg text-muted hover:text-danger hover:bg-surface transition-all"
                        title={t("common.delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted text-sm">
                  {t("products.notFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-lg animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {editingProduct ? t("products.form.edit") : t("products.form.add")}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingProduct(null); }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t("products.form.category")}</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => updateField("categoryId", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t("products.form.selectCategory")}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t("products.form.image")}</label>
                  <div className="flex items-center gap-3">
                    {formData.image && (
                      <div
                        className="w-10 h-10 rounded-lg bg-cover bg-center border border-border"
                        style={{ backgroundImage: `url(${formData.image})` }}
                      />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg, image/png"
                      onChange={handleImageUpload}
                      className="block w-full text-xs text-muted
                          file:mr-3 file:py-1.5 file:px-3
                          file:rounded-lg file:border-0
                          file:text-xs file:font-semibold
                          file:bg-primary/10 file:text-primary
                          hover:file:bg-primary/20 transition-all focus:outline-none"
                    />
                    {formData.image && (
                      <button
                        onClick={() => updateField('image', '')}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                        title="ลบรูปภาพ"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t("products.form.name")}</label>
                  <input
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={inputClass}
                    placeholder="เช่น ข้าวผัดกระเพรา"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t("products.form.sku")}</label>
                  <input
                    value={formData.sku}
                    onChange={(e) => updateField("sku", e.target.value)}
                    className={`${inputClass} ${!editingProduct ? "bg-black/5 opacity-70" : ""}`}
                    placeholder="Auto-generated"
                    readOnly={!editingProduct}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t("products.form.price")}</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    className={inputClass}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t("products.form.cost")}</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => updateField("cost", e.target.value)}
                    className={inputClass}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t("products.form.stock")}</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => updateField("stock", e.target.value)}
                    className={inputClass}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t("products.form.barcode")}</label>
                  <input
                    value={formData.barcode}
                    onChange={(e) => updateField("barcode", e.target.value)}
                    className={inputClass}
                    placeholder="เช่น 8850001"
                  />
                </div>
              </div>

              {/* Profit Preview */}
              {formData.price && (
                <div className="bg-surface rounded-xl p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("products.form.profitPerItem")}</span>
                    <span className="font-semibold text-success">
                      ฿{(Number(formData.price) - Number(formData.cost || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("products.form.profitMargin")}</span>
                    <span className="font-semibold text-primary">
                      {Number(formData.price) > 0
                        ? (((Number(formData.price) - Number(formData.cost || 0)) / Number(formData.price)) * 100).toFixed(1)
                        : "0"}%
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingProduct(null); }}
                  className="flex-1 py-2.5 bg-surface hover:bg-surface-hover text-foreground rounded-xl font-medium text-sm transition-all"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.sku || !formData.price || !formData.categoryId}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingProduct ? t("common.save") : t("common.add")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-sm animate-scale-in text-center">
            <div className="w-14 h-14 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-danger" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{t("products.delete.title")}</h3>
            <p className="text-sm text-muted mb-5">
              {t("products.delete.desc")} <span className="text-foreground font-semibold">{deleteConfirm.name}</span> {t("products.delete.confirm")}<br />
              {t("products.delete.warning")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-surface hover:bg-surface-hover text-foreground rounded-xl font-medium text-sm transition-all"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-danger hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-all"
              >
                {t("products.delete.productBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h3 className="text-lg font-bold text-foreground">
                {t("products.category.title")}
              </h3>
              <button
                onClick={() => { setShowCategoryForm(false); setEditingCategory(null); setCategoryData({ name: "", color: "#22c55e" }); }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of categories */}
            <div className="space-y-2 mb-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingCategory(cat); setCategoryData({ name: cat.name, color: cat.color }); }}
                      className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCategoryDelete(cat)}
                      className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form to Add/Edit Category */}
            <div className="pt-4 border-t border-border/50 shrink-0">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {editingCategory ? t("products.category.edit") : t("products.category.add")}
              </h4>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={categoryData.color}
                  onChange={(e) => setCategoryData({ ...categoryData, color: e.target.value })}
                  className="w-10 h-10 p-1 rounded-xl bg-surface border border-border cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={categoryData.name}
                  onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                  placeholder={t("products.category.namePlaceholder")}
                  className={`${inputClass} flex-1`}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCategorySubmit(); }}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {editingCategory && (
                  <button
                    onClick={() => { setEditingCategory(null); setCategoryData({ name: "", color: "#22c55e" }); }}
                    className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                )}
                <button
                  onClick={handleCategorySubmit}
                  disabled={!categoryData.name}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-primary/20"
                >
                  {editingCategory ? t("common.save") : t("products.category.addBtn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirm Dialog */}
      {deleteCategoryConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-sm animate-scale-in text-center">
            <div className="w-14 h-14 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-danger" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{t("products.deleteCat.title")}</h3>
            <p className="text-sm text-muted mb-6">
              {t("products.delete.desc")} <span className="text-foreground font-semibold">&quot;{deleteCategoryConfirm.name}&quot;</span> {t("products.delete.confirm")}<br />
              {t("products.delete.warning")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCategoryConfirm(null)}
                className="flex-1 py-2.5 bg-surface hover:bg-surface-hover text-foreground rounded-xl font-medium text-sm transition-all"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmCategoryDelete}
                className="flex-1 py-2.5 bg-danger hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-all"
              >
                {t("products.deleteCat.btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
