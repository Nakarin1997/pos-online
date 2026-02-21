"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCcw, Info, Settings as SettingsIcon, Coins, Calendar, Gift, QrCode } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";

export default function SettingsPage() {
  const { 
    fetchSettings, 
    updateBackendSettings, 
    pointsPerThb, 
    pointExpiryDays, 
    signupBonus,
    promptPayId,
    setPromptPayId
  } = useSettingsStore();

  const [localPointsPerThb, setLocalPointsPerThb] = useState(pointsPerThb);
  const [localPointExpiryDays, setLocalPointExpiryDays] = useState(pointExpiryDays);
  const [localSignupBonus, setLocalSignupBonus] = useState(signupBonus);
  const [localPromptPayId, setLocalPromptPayId] = useState(promptPayId);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      await fetchSettings();
    };
    init();
  }, [fetchSettings]);

  // Update local state when store changes (e.g. after fetch)
  useEffect(() => {
    setLocalPointsPerThb(pointsPerThb);
    setLocalPointExpiryDays(pointExpiryDays);
    setLocalSignupBonus(signupBonus);
    setLocalPromptPayId(promptPayId);
  }, [pointsPerThb, pointExpiryDays, signupBonus, promptPayId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const updates = {
      POINTS_PER_THB: localPointsPerThb.toString(),
      POINT_EXPIRY_DAYS: localPointExpiryDays.toString(),
      SIGNUP_BONUS_POINTS: localSignupBonus.toString(),
    };

    const success = await updateBackendSettings(updates);
    
    // Also update local PromptPay ID (stored in localStorage)
    setPromptPayId(localPromptPayId);

    if (success) {
      setMessage({ type: 'success', text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
    setIsSaving(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            การตั้งค่าระบบ
          </h1>
          <p className="text-sm text-muted mt-1">จัดการกฎเกณฑ์และค่ากำหนดต่างๆ ของร้านค้า</p>
        </div>
        <button
          onClick={() => fetchSettings()}
          className="p-2 text-muted hover:text-primary transition-colors bg-surface rounded-lg border border-border"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Points Settings Group */}
        <div className="glass-strong rounded-2xl p-6 border border-border/50">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            การตั้งค่าคะแนนสะสม (Membership Points)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Points Per THB */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-muted" />
                  อัตราการได้รับคะแนน
                </span>
                <span className="text-xs font-normal text-muted italic">ยอดซื้อ / 1 คะแนน</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  value={localPointsPerThb}
                  onChange={(e) => setLocalPointsPerThb(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                  placeholder="เช่น 100"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                  บาท
                </div>
              </div>
              <p className="text-xs text-muted flex items-start gap-1.5 p-2 bg-primary/5 rounded-lg border border-primary/10">
                <Info className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                ระบุจำนวนบาทที่ลูกค้าต้องจ่ายเพื่อให้ได้รับ 1 คะแนน (เช่น 100 บาท = 1 คะแนน)
              </p>
            </div>

            {/* Signup Bonus */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-muted" />
                  คะแนนโบนัสแรกเข้า
                </span>
                <span className="text-xs font-normal text-muted italic">แจกฟรีเมื่อสมัคร</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={localSignupBonus}
                  onChange={(e) => setLocalSignupBonus(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                  placeholder="เช่น 50"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                  คะแนน
                </div>
              </div>
              <p className="text-xs text-muted flex items-start gap-1.5 p-2 bg-primary/5 rounded-lg border border-primary/10">
                <Info className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                คะแนนสะสมที่สมาชิกใหม่จะได้รับทันทีที่ลงทะเบียน
              </p>
            </div>

            {/* Point Expiry */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted" />
                  ระยะเวลาคะแนนหมดอายุ
                </span>
                <span className="text-xs font-normal text-muted italic">0 = ไม่มีวันหมดอายุ</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={localPointExpiryDays}
                  onChange={(e) => setLocalPointExpiryDays(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                  placeholder="เช่น 365"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                  วัน
                </div>
              </div>
              <p className="text-xs text-muted flex items-start gap-1.5 p-2 bg-primary/5 rounded-lg border border-primary/10">
                <Info className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                ระบุจำนวนวันที่คะแนนจะมีอายุการใช้งานนับจากวันที่ได้รับ (FIFO)
              </p>
            </div>
          </div>
        </div>

        {/* Payment Settings Group */}
        <div className="glass-strong rounded-2xl p-6 border border-border/50">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            การชำระเงิน (Payment)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* PromptPay ID */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <QrCode className="w-4 h-4 text-muted" />
                เบอร์ PromptPay หรือ เลขบัตรประชาชน
              </label>
              <input
                type="text"
                value={localPromptPayId}
                onChange={(e) => setLocalPromptPayId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                placeholder="0XX-XXX-XXXX"
              />
              <p className="text-xs text-muted flex items-start gap-1.5 p-2 bg-primary/5 rounded-lg border border-primary/10">
                <Info className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                ใช้สำหรับสร้าง QR Code พร้อมเพย์ในการรับชำระเงิน
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          {message && (
            <div className={`text-sm font-medium ${message.type === 'success' ? 'text-success' : 'text-danger'} animate-fade-in`}>
              {message.text}
            </div>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
          >
            {isSaving ? (
              <RefreshCcw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            บันทึกการตั้งค่า
          </button>
        </div>
      </form>
    </div>
  );
}
