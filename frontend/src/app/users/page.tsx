"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Check, ShieldCheck, User as UserIcon, Briefcase } from "lucide-react";
import { useUserStore, User } from "@/stores/userStore";
import { UserRole } from "@/stores/authStore";

const roleIcons: Record<UserRole, { icon: React.ElementType; color: string; bg: string }> = {
  ADMIN: { icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-100" },
  MANAGER: { icon: Briefcase, color: "text-amber-600", bg: "bg-amber-100" },
  CASHIER: { icon: UserIcon, color: "text-emerald-600", bg: "bg-emerald-100" },
};

const defaultForm: Omit<User, 'id' | 'createdAt'> = {
  name: "",
  email: "",
  role: "CASHIER",
  password: "",
  status: "ACTIVE",
};

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useUserStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(defaultForm);
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password || "",
      status: user.status,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("กรุณากรอกข้อมูลให้ครบและกำหนดรหัสผ่าน");
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      // Check duplicate email
      if (users.some((u) => u.email === formData.email)) {
        alert("อีเมลนี้มีในระบบแล้ว");
        return;
      }
      addUser(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`คุณต้องการลบผู้ใช้ "${name}" ใช่หรือไม่?`)) {
      deleteUser(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-muted mt-1">เพิ่ม แก้ไข และลบแคชเชียร์หรือผู้จัดการ</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล..."
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
            เพิ่มผู้ใช้ใหม่
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUsers.map((user) => {
          const RIcon = roleIcons[user.role].icon;
          return (
            <div key={user.id} className="glass rounded-2xl p-5 hover:border-primary/30 transition-all flex flex-col h-full relative group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${roleIcons[user.role].bg} ${roleIcons[user.role].color}`}>
                  <RIcon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    disabled={user.role === 'ADMIN'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground truncate">{user.name}</h3>
                <p className="text-sm text-muted truncate">{user.email}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
                <span className={`px-2.5 py-1 rounded-md font-medium ${roleIcons[user.role].bg} ${roleIcons[user.role].color}`}>
                  {user.role}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${user.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted'}`}>
                  {user.status === 'ACTIVE' ? 'ใช้งาน' : 'ระงับการใช้งาน'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {editingUser ? "แก้ไขข้อมูลผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="เช่น แคชเชียร์ สมชาย"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">อีเมล (ใช้สำหรับเข้าสู่ระบบ)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1">รหัสผ่าน</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="รหัสผ่านสำหรับเข้าสู่ระบบ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">บทบาท (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground outline-none"
                  >
                    <option value="CASHIER">แคชเชียร์</option>
                    <option value="MANAGER">ผู้จัดการ</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                  </select>
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
