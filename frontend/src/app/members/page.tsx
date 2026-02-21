"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, Check, Award, Phone } from "lucide-react";
import { useMemberStore, Member, MemberTier } from "@/stores/memberStore";

const tierColors: Record<MemberTier, { text: string; bg: string }> = {
  BASIC: { text: "text-slate-600", bg: "bg-slate-100" },
  SILVER: { text: "text-slate-500", bg: "bg-slate-200" },
  GOLD: { text: "text-amber-600", bg: "bg-amber-100" },
  PLATINUM: { text: "text-purple-600", bg: "bg-purple-100" },
};

const defaultForm: Omit<Member, 'id' | 'points' | 'tier' | 'totalSpent' | 'lastVisit' | 'createdAt'> = {
  name: "",
  phone: "",
};

export default function MembersPage() {
  const { members, fetchMembers, addMember, updateMember, deleteMember } = useMemberStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData(defaultForm);
    setShowModal(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      phone: member.phone,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      alert("กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วน");
      return;
    }

    if (editingMember) {
      await updateMember(editingMember.id, formData);
    } else {
      if (members.some((m) => m.phone === formData.phone)) {
        alert("เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว");
        return;
      }
      await addMember(formData);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`คุณต้องการลบสมาชิก "${name}" ใช่หรือไม่?`)) {
      await deleteMember(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ระบบสมาชิก</h1>
          <p className="text-sm text-muted mt-1">จัดการข้อมูลสมาชิกและคะแนนสะสม</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร..."
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
            เพิ่มสมาชิก
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">เบอร์โทร</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">ชื่อ</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">ระดับ</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">คะแนนสะสม</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">ยอดซื้อสะสม</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2 font-mono text-sm text-foreground">
                    <Phone className="w-3.5 h-3.5 text-muted" />
                    {member.phone}
                  </div>
                </td>
                <td className="p-4 font-medium text-foreground">{member.name}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 w-max ${tierColors[member.tier].bg} ${tierColors[member.tier].text}`}>
                    <Award className="w-3.5 h-3.5" />
                    {member.tier}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-primary">{member.points.toLocaleString()}</td>
                <td className="p-4 text-right text-muted text-sm border-r border-border/50">
                  ฿{member.totalSpent.toLocaleString()}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {editingMember ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มสมาชิกใหม่"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="0812345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="ชื่อลูกค้า"
                />
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
