"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, Check, Tag, Calendar, Layers, Gift, AlertCircle, Clock } from "lucide-react";
import { usePromoStore, Promotion, PromotionCondition, PromotionReward, ConditionType, RewardType } from "@/stores/promoStore";
import { useProductStore } from "@/stores/productStore";
import { format } from "date-fns";

const defaultForm: Omit<Promotion, 'id' | 'createdAt' | 'usedCount'> = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  usageLimit: undefined,
  isActive: true,
  status: "ACTIVE",
  conditions: [],
  rewards: [],
};

const CONDITION_LABELS: Record<ConditionType, string> = {
  MIN_CART_TOTAL: "ยอดซื้อรวมขั้นต่ำ",
  MIN_ITEM_QTY: "ซื้อสินค้าครบจำนวน",
  SPECIFIC_ITEM: "ต้องมีสินค้าในตะกร้า",
  SPECIFIC_CATEGORY: "ต้องมีสินค้าในหมวดหมู่",
};

const REWARD_LABELS: Record<RewardType, string> = {
  DISCOUNT_AMOUNT: "ส่วนลด (บาท)",
  DISCOUNT_PERCENT: "ส่วนลด (%)",
  FIXED_PRICE: "ราคาพิเศษ (Set Price)",
  FREE_ITEM: "แถมสินค้าฟรี",
};

export default function PromotionsPage() {
  const { promotions, fetchPromotions, addPromotion, updatePromotion, deletePromotion } = usePromoStore();
  const { products, categories, fetchProducts, fetchCategories } = useProductStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
    fetchCategories();
  }, [fetchPromotions, fetchProducts, fetchCategories]);

  const filteredPromos = promotions.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setFormData(defaultForm);
    setShowModal(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name,
      description: promo.description || "",
      startDate: promo.startDate ? promo.startDate.split('T')[0] : "",
      endDate: promo.endDate ? promo.endDate.split('T')[0] : "",
      usageLimit: promo.usageLimit,
      isActive: promo.isActive,
      status: promo.status,
      conditions: promo.conditions.map(c => ({
        type: c.type,
        productId: c.productId,
        categoryId: c.categoryId,
        value: Number(c.value)
      })),
      rewards: promo.rewards.map(r => ({
        type: r.type,
        productId: r.productId,
        value: Number(r.value)
      })),
    });
    setShowModal(true);
  };

  const handleAddCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { type: 'MIN_CART_TOTAL', value: 0 }]
    });
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = [...formData.conditions];
    newConditions.splice(index, 1);
    setFormData({ ...formData, conditions: newConditions });
  };

  const handleUpdateCondition = (index: number, data: Partial<PromotionCondition>) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], ...data };
    setFormData({ ...formData, conditions: newConditions });
  };

  const handleAddReward = () => {
    setFormData({
      ...formData,
      rewards: [...formData.rewards, { type: 'DISCOUNT_AMOUNT', value: 0 }]
    });
  };

  const handleRemoveReward = (index: number) => {
    const newRewards = [...formData.rewards];
    newRewards.splice(index, 1);
    setFormData({ ...formData, rewards: newRewards });
  };

  const handleUpdateReward = (index: number, data: Partial<PromotionReward>) => {
    const newRewards = [...formData.rewards];
    newRewards[index] = { ...newRewards[index], ...data };
    setFormData({ ...formData, rewards: newRewards });
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("กรุณากรอกชื่อโปรโมชั่น");
      return;
    }
    if (formData.conditions.length === 0 || formData.rewards.length === 0) {
      alert("กรุณาระบุอย่างน้อย 1 เงื่อนไข และ 1 รางวัล");
      return;
    }

    const payload = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    };

    if (editingPromo) {
      await updatePromotion(editingPromo.id, payload);
    } else {
      await addPromotion(payload);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`คุณต้องการลบโปรโมชั่น "${name}" ใช่หรือไม่?`)) {
      await deletePromotion(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">โปรโมชั่นอัจฉริยะ (Rules Engine)</h1>
          <p className="text-sm text-muted mt-1">กำหนดเงื่อนไขและรางวัลของโปรโมชั่นได้อย่างอิสระ</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="ค้นหาชื่อโปรโมชั่น..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all text-foreground placeholder:text-muted"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/30"
          >
            <Plus className="w-5 h-5" />
            เพิ่มกฎโปรโมชั่น
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromos.map((promo) => (
          <div key={promo.id} className="glass rounded-2xl p-5 hover:border-primary/30 transition-all flex flex-col h-full relative group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Tag className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(promo)}
                  className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(promo.id, promo.name)}
                  className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground mb-1">{promo.name}</h3>
              {promo.description && <p className="text-xs text-muted mb-3 line-clamp-2">{promo.description}</p>}
              
              <div className="space-y-3 mt-4">
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">เงื่อนไข (Conditions)</span>
                  <div className="space-y-1">
                    {promo.conditions.map((c, i) => (
                      <div key={i} className="text-xs text-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {CONDITION_LABELS[c.type]} {c.value ? `: ${Number(c.value).toLocaleString()}` : ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block mb-1">รางวัล (Rewards)</span>
                  <div className="space-y-1">
                    {promo.rewards.map((r, i) => (
                      <div key={i} className="text-xs text-green-700 font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {REWARD_LABELS[r.type]} {r.value ? `: ${Number(r.value).toLocaleString()}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {promo.startDate ? format(new Date(promo.startDate), 'dd/MM/yy') : 'เริ่มเลย'} 
                  <span>-</span>
                  {promo.endDate ? format(new Date(promo.endDate), 'dd/MM/yy') : 'ไม่มีกำหนด'}
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  ใช้แล้ว {promo.usedCount}{promo.usageLimit ? `/${promo.usageLimit}` : ''}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                  promo.isActive && promo.status === 'ACTIVE' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-muted/20 text-muted'
                }`}>
                  {promo.isActive && promo.status === 'ACTIVE' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
                <span className="text-[10px] text-muted font-mono">{promo.id.substring(0,8)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editingPromo ? "แก้ไขโปรโมชั่น" : "สร้างโปรโมชั่นใหม่"}
                  </h2>
                  <p className="text-xs text-muted">กำหนดกฎเกณฑ์สำหรับโปรโมชั่นของคุณ</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover text-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {/* Section 1: Basic Info */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-foreground">ข้อมูลพื้นฐาน</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-muted uppercase mb-1.5 ml-1">ชื่อโปรโมชั่น *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="เช่น ชุดคุ้มเว่อร์ Coffee & Cake"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-muted uppercase mb-1.5 ml-1">คำอธิบาย</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-20 resize-none"
                      placeholder="อธิบายรายละเอียดโปรโมชั่นสั้นๆ..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase mb-1.5 ml-1">วันที่เริ่ม</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase mb-1.5 ml-1">วันที่สิ้นสุด</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase mb-1.5 ml-1">จำกัดจำนวนสิทธิ์ (0 = ไม่จำกัด)</label>
                    <input
                      type="number"
                      value={formData.usageLimit || ""}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:border-primary outline-none transition-all"
                      placeholder="เช่น 100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase mb-1.5 ml-1">สถานะเริ่มต้น</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground outline-none transition-all"
                    >
                      <option value="ACTIVE">เปิดใช้งาน (ACTIVE)</option>
                      <option value="INACTIVE">ปิดใช้งาน (INACTIVE)</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section 2: Conditions */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <h3 className="font-bold text-foreground">เงื่อนไข (Conditions)</h3>
                  </div>
                  <button 
                    onClick={handleAddCondition}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover px-2 py-1 rounded-lg hover:bg-primary/5 transition-all"
                  >
                    <Plus className="w-4 h-4" /> เพิ่มเงื่อนไข
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.conditions.map((condition, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-background border border-border relative group/row animate-in slide-in-from-right-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                        <div>
                          <label className="block text-[10px] font-bold text-muted uppercase mb-1 ml-1">ประเภทเงื่อนไข</label>
                          <select
                            value={condition.type}
                            onChange={(e) => handleUpdateCondition(idx, { type: e.target.value as ConditionType })}
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground outline-none"
                          >
                            {Object.entries(CONDITION_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>

                        {condition.type === 'MIN_CART_TOTAL' && (
                          <div>
                            <label className="block text-[10px] font-bold text-muted uppercase mb-1 ml-1">ยอดเงินขั้นต่ำ (฿)</label>
                            <input
                              type="number"
                              value={condition.value || ""}
                              onChange={(e) => handleUpdateCondition(idx, { value: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground outline-none"
                              placeholder="เช่น 500"
                            />
                          </div>
                        )}

                        {condition.type === 'MIN_ITEM_QTY' && (
                          <>
                            <div>
                              <label className="block text-[10px] font-bold text-muted uppercase mb-1 ml-1">เลือกสินค้า</label>
                              <select
                                value={condition.productId || ""}
                                onChange={(e) => handleUpdateCondition(idx, { productId: e.target.value })}
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground outline-none"
                              >
                                <option value="">เลือกสินค้า...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <div className="md:col-start-2">
                              <label className="block text-[10px] font-bold text-muted uppercase mb-1 ml-1">จำนวนขั้นต่ำ (ชิ้น)</label>
                              <input
                                type="number"
                                value={condition.value || ""}
                                onChange={(e) => handleUpdateCondition(idx, { value: Number(e.target.value) })}
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground outline-none"
                                placeholder="เช่น 2"
                              />
                            </div>
                          </>
                        )}

                        {(condition.type === 'SPECIFIC_ITEM') && (
                          <div>
                            <label className="block text-[10px] font-bold text-muted uppercase mb-1 ml-1">เลือกสินค้า</label>
                            <select
                              value={condition.productId || ""}
                              onChange={(e) => handleUpdateCondition(idx, { productId: e.target.value })}
                              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground outline-none"
                            >
                              <option value="">เลือกสินค้า...</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                        )}

                        {condition.type === 'SPECIFIC_CATEGORY' && (
                          <div>
                            <label className="block text-[10px] font-bold text-muted uppercase mb-1 ml-1">เลือกหมวดหมู่</label>
                            <select
                              value={condition.categoryId || ""}
                              onChange={(e) => handleUpdateCondition(idx, { categoryId: e.target.value })}
                              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground outline-none"
                            >
                              <option value="">เลือกหมวดหมู่...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveCondition(idx)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.conditions.length === 0 && (
                    <div className="p-8 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted">
                      <Clock className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm font-medium">ยังไม่มีเงื่อนไข</p>
                      <p className="text-xs">คลิก "เพิ่มเงื่อนไข" เพื่อเริ่มกำหนดกฎ</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Section 3: Rewards */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-500" />
                    <h3 className="font-bold text-foreground">สิ่งที่ได้รับ (Rewards)</h3>
                  </div>
                  <button 
                    onClick={handleAddReward}
                    className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 px-2 py-1 rounded-lg hover:bg-green-500/5 transition-all"
                  >
                    <Plus className="w-4 h-4" /> เพิ่มรางวัล
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.rewards.map((reward, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-green-500/5 border border-green-500/20 relative group/row animate-in slide-in-from-right-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                        <div>
                          <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">ประเภทสิทธิประโยชน์</label>
                          <select
                            value={reward.type}
                            onChange={(e) => handleUpdateReward(idx, { type: e.target.value as RewardType })}
                            className="w-full px-3 py-2 bg-surface border border-green-500/20 rounded-lg text-sm text-foreground outline-none"
                          >
                            {Object.entries(REWARD_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>

                        {reward.type === 'DISCOUNT_AMOUNT' && (
                          <div>
                            <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">ยอดส่วนลด (฿)</label>
                            <input
                              type="number"
                              value={reward.value || ""}
                              onChange={(e) => handleUpdateReward(idx, { value: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-surface border border-green-500/20 rounded-lg text-sm text-foreground outline-none"
                              placeholder="เช่น 50"
                            />
                          </div>
                        )}

                        {reward.type === 'DISCOUNT_PERCENT' && (
                          <div>
                            <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">ยอดส่วนลด (%)</label>
                            <input
                              type="number"
                              value={reward.value || ""}
                              onChange={(e) => handleUpdateReward(idx, { value: Number(e.target.value) })}
                              className="w-full px-3 py-2 bg-surface border border-green-500/20 rounded-lg text-sm text-foreground outline-none"
                              placeholder="เช่น 10"
                            />
                          </div>
                        )}

                        {reward.type === 'FIXED_PRICE' && (
                          <>
                             <div>
                              <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">สินค้าที่ได้รับสิทธิ์</label>
                              <select
                                value={reward.productId || ""}
                                onChange={(e) => handleUpdateReward(idx, { productId: e.target.value })}
                                className="w-full px-3 py-2 bg-surface border border-green-500/20 rounded-lg text-sm text-foreground outline-none"
                              >
                                <option value="">เลือกสินค้า...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">ราคาใหม่ (฿)</label>
                                <input
                                  type="number"
                                  value={reward.value || ""}
                                  onChange={(e) => handleUpdateReward(idx, { value: Number(e.target.value) })}
                                  className="w-full px-3 py-2 bg-surface border border-green-500/20 rounded-lg text-sm text-foreground outline-none"
                                  placeholder="ราคาขายคงที่"
                                />
                            </div>
                          </>
                        )}

                        {reward.type === 'FREE_ITEM' && (
                          <>
                             <div>
                              <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">สินค้าแถมฟรี</label>
                              <select
                                value={reward.productId || ""}
                                onChange={(e) => handleUpdateReward(idx, { productId: e.target.value })}
                                className="w-full px-3 py-2 bg-surface border border-green-500/20 rounded-lg text-sm text-foreground outline-none"
                              >
                                <option value="">เลือกสินค้า...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-green-700 uppercase mb-1 ml-1">จำนวนที่แถม (ชิ้น)</label>
                                <input
                                  type="number"
                                  value={reward.value || ""}
                                  onChange={(e) => handleUpdateReward(idx, { value: Number(e.target.value) })}
                                  className="w-full px-3 py-2 bg-surface border border-green-500/20 rounded-lg text-sm text-foreground outline-none"
                                  placeholder="เช่น 1"
                                />
                            </div>
                          </>
                        )}
                      </div>

                      <button 
                        onClick={() => handleRemoveReward(idx)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {formData.rewards.length === 0 && (
                    <div className="p-8 border-2 border-dashed border-green-500/20 rounded-2xl flex flex-col items-center justify-center text-muted">
                      <Gift className="w-8 h-8 mb-2 opacity-20 text-green-500" />
                      <p className="text-sm font-medium">ยังไม่ได้กำหนดรางวัล</p>
                      <p className="text-xs">ลูกค้าจะไม่ได้อะไรเลยถ้าไม่เพิ่มรางวัลตรงนี้</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-background text-foreground rounded-xl border border-border hover:bg-surface-hover transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 font-bold transition-all flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                บันทึกโปรโมชั่น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
