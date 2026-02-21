"use client";

import { X, Save, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSettingsStore } from "@/stores/settingsStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { promptPayId, setPromptPayId } = useSettingsStore();
  const [localPromptPay, setLocalPromptPay] = useState(promptPayId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSave = () => {
    setPromptPayId(localPromptPay);
    alert("บันทึกการตั้งค่าสำเร็จ");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
      <div className="glass-strong rounded-2xl w-full max-w-md animate-scale-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            ตั้งค่าการชำระเงิน
          </h3>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              เบอร์โทรศัพท์ / เลขประจำตัวประชาชน (PromptPay)
            </label>
            <input
              type="text"
              value={localPromptPay}
              onChange={(e) => setLocalPromptPay(e.target.value.replace(/\D/g, ''))}
              placeholder="08XXXXXXXX หรือ ดิจิทัล ID 13 หลัก"
              maxLength={15}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
            />
            <p className="text-xs text-muted mt-2">
              หมายเลขนี้จะถูกนำไปผูกเพื่อสร้าง QR Code รับเงินอัตโนมัติในหน้าชำระเงิน
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 mt-2">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            style={{ boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)" }}
          >
            <Save className="w-5 h-5" />
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
