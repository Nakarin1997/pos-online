"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Check, Tag } from "lucide-react";
import { usePromoStore, Promotion, PromoType } from "@/stores/promoStore";

const defaultForm: Omit<Promotion, 'id' | 'createdAt'> = {
  name: "",
  type: "DISCOUNT_AMOUNT",
  value: 0,
  minSpend: 0,
  status: "ACTIVE",
};

export default function PromotionsPage() {
  const { promotions, addPromotion, updatePromotion, deletePromotion } = usePromoStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState(defaultForm);

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
      type: promo.type,
      value: promo.value,
      minSpend: promo.minSpend,
      status: promo.status,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.value <= 0) {
      alert("กรุณากรอกชื่อโปรโมชั่นและมูลค่าส่วนลดให้ถูกต้อง");
      return;
    }

    if (editingPromo) {
      updatePromotion(editingPromo.id, formData);
    } else {
      addPromotion(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบโปรโมชั่น "${name}" ใช่หรือไม่?`)) {
      deletePromotion(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">โปรโมชั่นและส่วนลด</h1>
          <p className="text-sm text-muted mt-1">จัดการส่วนลดสำหรับร้านค้าเพื่อกระตุ้นยอดขาย</p>
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
            เพิ่มโปรโมชั่น
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromos.map((promo) => (
          <div key={promo.id} className="glass rounded-2xl p-5 hover:border-primary/30 transition-all flex flex-col h-full relative group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                <Tag className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <p className="text-sm font-medium text-orange-600 mb-2">
                {promo.type === 'DISCOUNT_AMOUNT' ? `ลด ${promo.value} บาท` : `ลด ${promo.value}%`}
              </p>
              {promo.minSpend > 0 && (
                <p className="text-xs text-muted">เมื่อซื้อขั้นต่ำ: ฿{promo.minSpend.toLocaleString()}</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded-full font-medium ${promo.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted'}`}>
                {promo.status === 'ACTIVE' ? 'ใช้งาน' : 'ระงับการใช้งาน'}
              </span>
              <span className="text-muted">ID: {promo.id}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {editingPromo ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่นใหม่"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">ชื่อโปรโมชั่น *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="เช่น ลด 50 บาทท้ายบิล, ลด 10% ปีใหม่"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">ประเภทส่วนลด</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PromoType })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground outline-none"
                  >
                    <option value="DISCOUNT_AMOUNT">ลดตามยอด (฿)</option>
                    <option value="DISCOUNT_PERCENT">ลดเป็น %</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">มูลค่าส่วนลด *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">ขั้นต่ำในการซื้อ (บาท)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minSpend}
                  onChange={(e) => setFormData({ ...formData, minSpend: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="0 = ไม่มีขั้นต่ำ"
                />
                <p className="text-xs text-muted mt-1">ใส่ 0 หากไม่มีขั้นต่ำ</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">สถานะ</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground outline-none"
                >
                  <option value="ACTIVE">ใช้งาน</option>
                  <option value="INACTIVE">ระงับ</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-background text-foreground rounded-xl border border-border hover:bg-surface-hover transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover shadow-md font-medium transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
