"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, X, Check, Package, AlertCircle, Tag } from "lucide-react";
import QRCode from "react-qr-code";
import generatePayload from "promptpay-qr";
import { useCartStore } from "@/stores/cartStore";
import { useProductStore } from "@/stores/productStore";
import { useOrderStore } from "@/stores/orderStore";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores/languageStore";
import { PaymentMethod, Order } from "@/types";
import { ReceiptPrint } from "@/components/pos/ReceiptPrint";
import { useMemberStore, Member } from "@/stores/memberStore";
import { usePromoStore, Promotion } from "@/stores/promoStore";
import { useSettingsStore } from "@/stores/settingsStore";

const paymentMethods: Array<{ method: PaymentMethod; label: string; icon: React.ElementType }> = [
  { method: "CASH", label: "เงินสด", icon: Banknote },
  { method: "CREDIT_CARD", label: "บัตรเครดิต", icon: CreditCard },
  { method: "PROMPTPAY", label: "พร้อมเพย์", icon: QrCode },
];

export default function POSPage() {
  const { products, categories, deductStock, fetchProducts, fetchCategories } = useProductStore();
  const { t } = useLanguageStore();
  const allCategories = [{ id: "all", name: t("pos.filterAll"), color: "#6366f1", isActive: true }, ...categories];
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const { fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSettings();
  }, [fetchProducts, fetchCategories, fetchSettings]);

  // Members and Promotions State
  const members = useMemberStore((state) => state.members);
  const addPoints = useMemberStore((state) => state.addPoints);
  const promotions = usePromoStore((state) => state.promotions);

  const [memberPhone, setMemberPhone] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [appliedPromos, setAppliedPromos] = useState<Promotion[]>([]);
  const [bonusItems, setBonusItems] = useState<{ productId: string, name: string, quantity: number }[]>([]);

  // Settings State
  const promptPayId = useSettingsStore((state) => state.promptPayId);

  // Checkout UX State
  const [cashReceived, setCashReceived] = useState<number>(0);

  const {
    items,
    discount,
    paymentMethod,
    addItem,
    removeItem,
    updateQuantity,
    setDiscount,
    setPaymentMethod,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
    getItemCount,
  } = useCartStore();

  const filteredProducts = products.filter((product) => {
    const matchCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    const matchSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleCheckout = () => {
    if (items.length === 0) return;
    setShowCheckout(true);
  };

  // Rules Engine: Smart Cart Scanner
  useEffect(() => {
    evaluateSmartPromotions();
  }, [items, promotions]);

  const evaluateSmartPromotions = () => {
    const subtotal = getSubtotal();
    const now = new Date();
    let totalDiscount = 0;
    const matchedPromos: Promotion[] = [];
    const bonuses: { productId: string, name: string, quantity: number }[] = [];

    promotions.forEach(promo => {
      if (promo.status !== 'ACTIVE' || !promo.isActive) return;
      
      // Check Dates
      if (promo.startDate && new Date(promo.startDate) > now) return;
      if (promo.endDate && new Date(promo.endDate) < now) return;

      // Check Usage Limit
      if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return;

      // Check Conditions
      const isMet = promo.conditions.every(cond => {
        switch (cond.type) {
          case 'MIN_CART_TOTAL':
            return subtotal >= (Number(cond.value) || 0);
          case 'MIN_ITEM_QTY': {
            const item = items.find(i => i.product.id === cond.productId);
            return item && item.quantity >= (Number(cond.value) || 0);
          }
          case 'SPECIFIC_ITEM':
            return items.some(i => i.product.id === cond.productId);
          case 'SPECIFIC_CATEGORY':
            return items.some(i => i.product.categoryId === cond.categoryId);
          default:
            return false;
        }
      });

      if (isMet && promo.conditions.length > 0) {
        matchedPromos.push(promo);
        // Calculate Rewards
        promo.rewards.forEach(reward => {
          switch (reward.type) {
            case 'DISCOUNT_AMOUNT':
              totalDiscount += Number(reward.value);
              break;
            case 'DISCOUNT_PERCENT':
              totalDiscount += subtotal * (Number(reward.value) / 100);
              break;
            case 'FIXED_PRICE': {
              const item = items.find(i => i.product.id === reward.productId);
              if (item) {
                const diff = (item.product.price - Number(reward.value)) * item.quantity;
                if (diff > 0) totalDiscount += diff;
              }
              break;
            }
            case 'FREE_ITEM': {
              const prod = products.find(p => p.id === reward.productId);
              if (prod) {
                bonuses.push({ productId: prod.id, name: prod.name, quantity: Number(reward.value) });
              }
              break;
            }
          }
        });
      }
    });

    setAppliedPromos(matchedPromos);
    setDiscount(totalDiscount);
    setBonusItems(bonuses);
  };

  const handleMemberSearch = () => {
    const member = members.find((m) => m.phone === memberPhone);
    if (member) {
      setSelectedMember(member);
    } else {
      alert("ไม่พบสมาชิกด้วยเบอร์โทรนี้");
      setSelectedMember(null);
    }
  };

  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  
  const { addOrder } = useOrderStore();
  const { user } = useAuthStore();

  const handleConfirmOrder = async () => {
    if (!user?.id) {
      alert("ไม่พบข้อมูลพนักงานขาย กรุณาเข้าสู่ระบบอีกครั้ง");
      return;
    }

    const finalTotal = getTotal() - pointsToRedeem;
    
    const payload = {
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
      })),
      discount: discount + pointsToRedeem, // Treat redeemed points as generic discount on Payload for now, or send separately
      paymentMethod,
      userId: user.id,
      memberId: selectedMember?.id,
      pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : undefined,
      promoIds: appliedPromos.map(p => p.id), // Sending multiple promos now
      cashReceived: paymentMethod === 'CASH' ? cashReceived : undefined,
      change: paymentMethod === 'CASH' ? Math.max(0, cashReceived - finalTotal) : undefined,
    };

    const newOrder = await addOrder(payload);

    if (!newOrder) {
      alert("เกิดข้อผิดพลาดในการบันทึกออเดอร์");
      return;
    }

    // Deduct stock locally for immediate UI update
    items.forEach((item) => {
      deductStock(item.product.id, item.quantity);
    });

    // Add points to member
    if (selectedMember) {
      const pointsToAdd = Math.floor(finalTotal / 10); // 1 point per 10 THB
      addPoints(selectedMember.id, pointsToAdd, finalTotal);
    }

    setCompletedOrder(newOrder);
    setOrderComplete(true);
  };

  const handleNewOrder = () => {
    clearCart();
    setShowCheckout(false);
    setOrderComplete(false);
    setDiscount(0);
    setCashReceived(0);
    setCompletedOrder(null);
    setMemberPhone("");
    setSelectedMember(null);
    setAppliedPromos([]);
    setBonusItems([]);
  };

  return (
    <div className="flex h-screen">
      {/* Left: Product Area */}
      <div className="flex-1 flex flex-col p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("pos.title")}</h1>
            <p className="text-sm text-muted">{t("pos.subtitle")}</p>
          </div>
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder={t("pos.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                transition-all duration-200
                ${
                  selectedCategory === cat.id
                    ? "text-white shadow-lg"
                    : "glass text-muted hover:text-foreground"
                }
              `}
              style={
                selectedCategory === cat.id
                  ? { background: cat.color, boxShadow: `0 4px 15px ${cat.color}40` }
                  : {}
              }
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              return (
              <button
                key={product.id}
                onClick={() => !isOutOfStock && addItem(product)}
                disabled={isOutOfStock}
                className={`glass flex flex-col rounded-2xl p-4 text-left transition-all duration-200 group animate-fade-in relative overflow-hidden ${
                  isOutOfStock ? "opacity-60 cursor-not-allowed grayscale" : "hover:scale-[1.02] hover:glow-primary active:scale-[0.98]"
                }`}
              >
                {isOutOfStock && (
                  <div className="absolute top-3 -right-8 bg-danger text-white text-[10px] font-bold py-1 px-8 rotate-45 shadow-lg z-10 w-32 text-center pointer-events-none">
                    สินค้าหมด
                  </div>
                )}
                <div
                  className="w-full aspect-square rounded-xl mb-3 flex items-center justify-center text-3xl shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${
                      allCategories.find((c) => c.id === product.categoryId)?.color || "#6366f1"
                    }20, ${
                      allCategories.find((c) => c.id === product.categoryId)?.color || "#6366f1"
                    }05)`,
                  }}
                >
                  <Package className="w-8 h-8 text-muted group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col flex-1 w-full mt-auto">
                  <h3 className="font-semibold text-sm text-foreground truncate w-full" title={product.name}>
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 w-full shrink-0">
                    <span className={`font-bold ${isOutOfStock ? "text-muted" : "text-primary"}`}>
                      ฿{Number(product.price).toFixed(2)}
                    </span>
                    <span className={`text-xs ${isOutOfStock ? "text-danger flex items-center gap-1" : "text-muted"}`}>
                      {isOutOfStock ? <><AlertCircle className="w-3 h-3" /> หมด</> : `${t("pos.stock")} ${product.stock}`}
                    </span>
                  </div>
                </div>
              </button>
            )})}
          </div>
        </div>
      </div>

      {/* Right: Cart Sidebar */}
      <div className="w-[380px] glass-strong flex flex-col h-screen">
        {/* Cart Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">{t("pos.cart.title")}</h2>
                <p className="text-xs text-muted">{getItemCount()} {t("pos.cart.items")}</p>
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-danger hover:text-red-400 transition-colors"
              >
                {t("pos.cart.clear")}
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">{t("pos.cart.empty")}</p>
              <p className="text-xs mt-1">{t("pos.cart.emptyHint")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-surface rounded-xl p-3 animate-slide-up"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted">฿{item.product.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-muted hover:text-danger transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-muted hover:text-foreground transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-muted hover:text-foreground transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-bold text-sm text-primary">
                      ฿{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Bonus Items Display */}
              {bonusItems.map((bonus, idx) => (
                <div key={`bonus-${idx}`} className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex items-center justify-between animate-pulse">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500" />
                      <h4 className="font-bold text-xs text-green-600 uppercase tracking-tight">Bonus Item</h4>
                    </div>
                    <p className="text-sm font-medium text-foreground">{bonus.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">ฟรี x{bonus.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
          <div className="p-5 border-t border-border space-y-3">
            {/* Applied Promotions Tags */}
            {appliedPromos.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {appliedPromos.map(p => (
                  <span key={p.id} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" /> {p.name}
                  </span>
                ))}
              </div>
            )}

            {/* Discount Manual Override */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted whitespace-nowrap">{t("pos.cart.discount")}:</label>
              <input
                type="number"
                min={0}
                value={discount || 0}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all font-bold"
                placeholder="0.00"
              />
            </div>

            {/* Summary */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>{t("pos.cart.subtotal")}</span>
                <span>฿{getSubtotal().toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-danger">
                  <span>{t("pos.cart.discount")}</span>
                  <span>-฿{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>มูลค่าสินค้า (Before VAT)</span>
                <span>฿{(getTotal() - getTax()).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>VAT (7%)</span>
                <span>฿{getTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>รวมทั้งสิ้น (Total)</span>
                <span className="text-primary">฿{getTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
              style={{ boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)" }}
            >
              ชำระเงิน
            </button>
          </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="glass-strong rounded-2xl w-full max-w-md animate-scale-in flex flex-col max-h-[90vh]">
            {orderComplete ? (
              <div className="text-center p-8 overflow-y-auto">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 shrink-0">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t("pos.checkout.success")}</h3>
                <p className="text-muted mb-6">{t("pos.checkout.successDesc")}</p>
                <div className="flex gap-3 justify-center shrink-0">
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-surface border border-border rounded-xl text-foreground font-medium hover:bg-surface-hover transition-colors"
                  >
                    พิมพ์ใบเสร็จ
                  </button>
                  <button
                    onClick={handleNewOrder}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover shadow-lg transition-all active:scale-[0.98]"
                  >
                    ออเดอร์ใหม่
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Modal Header (Fixed) */}
                <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
                  <h3 className="text-lg font-bold text-foreground">{t("pos.checkout.title")}</h3>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="p-6 overflow-y-auto space-y-5">
                  {/* Order Items Preview */}
                <div className="bg-surface border border-border rounded-xl p-4 mb-5 max-h-48 overflow-y-auto space-y-2">
                  <h4 className="text-xs font-medium text-muted mb-2">สรุปรายการสินค้า ({getItemCount()} รายการ)</h4>
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-semibold text-primary">{item.quantity}x</span>
                        <span className="text-foreground truncate">{item.product.name}</span>
                      </div>
                      <span className="font-medium">฿{(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Membership & Promotions Section */}
                <div className="bg-surface border border-border rounded-xl p-4 mb-5 space-y-4">
                  {/* Member Search */}
                  <div>
                    <label className="text-xs font-medium text-muted mb-1.5 block">สมาชิกร้านค้า (เบอร์โทรศัพท์)</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={memberPhone}
                        onChange={(e) => setMemberPhone(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        placeholder="08X-XXX-XXXX"
                        disabled={!!selectedMember}
                      />
                      {selectedMember ? (
                        <button
                          onClick={() => { setSelectedMember(null); setMemberPhone(""); }}
                          className="px-3 py-2 bg-danger/10 text-danger rounded-lg text-sm font-medium hover:bg-danger/20 transition-colors"
                        >
                          ยกเลิก
                        </button>
                      ) : (
                        <button
                          onClick={handleMemberSearch}
                          className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                          ค้นหา
                        </button>
                      )}
                    </div>
                    {selectedMember && (
                      <div className="mt-2 text-xs text-primary font-medium flex-col space-y-2">
                        <div className="flex justify-between w-full">
                          <span>{selectedMember.name} (ระดับ: {selectedMember.tier})</span>
                          <span>แต้มที่มี: {selectedMember.points.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between w-full bg-primary/10 p-2 rounded-lg border border-primary/20">
                          <label className="text-primary font-bold">ใช้แต้มส่วนลด</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={selectedMember.points}
                              value={pointsToRedeem || ''}
                              onChange={(e) => {
                                let val = parseInt(e.target.value, 10) || 0;
                                if (val > selectedMember.points) val = selectedMember.points;
                                setPointsToRedeem(val);
                              }}
                              className="w-16 px-2 py-1 bg-background border border-primary/30 rounded text-center font-mono focus:border-primary outline-none"
                              placeholder="0"
                            />
                            <span>pt</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Promotions Info (Auto-applied) */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <label className="text-xs font-bold text-primary uppercase mb-2 block">โปรโมชั่นที่ส่งผล (Auto-applied)</label>
                    <div className="space-y-1.5">
                      {appliedPromos.length > 0 ? appliedPromos.map(p => (
                        <div key={p.id} className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground flex items-center gap-1">
                            <Check className="w-3 h-3 text-success" /> {p.name}
                          </span>
                          <span className="text-[10px] text-muted">Applied</span>
                        </div>
                      )) : (
                        <div className="flex items-center gap-2 text-muted grayscale">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-[10px]">ไม่มีโปรโมชั่นที่ตรงเงื่อนไข</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-2 mb-5">
                  <label className="text-sm font-medium text-muted">วิธีชำระเงิน</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((pm) => {
                      const Icon = pm.icon;
                      return (
                        <button
                          key={pm.method}
                          onClick={() => setPaymentMethod(pm.method)}
                          className={`
                            flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200
                            ${
                              paymentMethod === pm.method
                                ? "bg-primary/20 text-primary border border-primary/50"
                                : "bg-surface text-muted border border-border hover:border-primary/30"
                            }
                          `}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-surface rounded-xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>{getItemCount()} {t("pos.cart.items")}</span>
                    <span>฿{getSubtotal().toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-danger">
                      <span>{t("pos.cart.discount")}</span>
                      <span>-฿{discount.toFixed(2)}</span>
                    </div>
                  )}
                  {pointsToRedeem > 0 && (
                    <div className="flex justify-between text-primary font-medium">
                      <span>ใช้แต้มลดราคา ({pointsToRedeem} pt)</span>
                      <span>-฿{pointsToRedeem.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted">
                    <span>มูลค่าก่อน VAT</span>
                    <span>฿{(getTotal() - getTax() - pointsToRedeem).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>VAT (7%)</span>
                    <span>฿{getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                    <span>ยอดสุทธิ (Total)</span>
                    <span className="text-primary">฿{(getTotal() - pointsToRedeem).toFixed(2)}</span>
                  </div>
                </div>

                {/* Specific Payment Context Windows */}
                {paymentMethod === "CASH" && (
                  <div className="bg-surface rounded-xl p-4 mb-5 space-y-3 animate-fade-in border border-primary/20">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-sm font-medium text-foreground whitespace-nowrap">รับเงินสด:</label>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">฿</span>
                        <input
                          type="number"
                          min={0}
                          value={cashReceived || ""}
                          onChange={(e) => setCashReceived(Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-right font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                    {cashReceived >= getTotal() && (
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                        <span className="text-muted">เงินทอน:</span>
                        <span className="text-success font-bold text-lg">฿{(cashReceived - getTotal()).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "PROMPTPAY" && (
                  <div className="bg-surface rounded-xl p-6 mb-5 flex flex-col items-center justify-center animate-fade-in border border-primary/20 text-center">
                    <p className="text-sm font-medium text-muted mb-4">สแกน QR Code เพื่อชำระเงิน</p>
                    <div className="bg-white p-3 rounded-xl shadow-sm mb-3 inline-block">
                       <QRCode value={generatePayload(promptPayId || "0812345678", { amount: getTotal() })} size={160} />
                    </div>
                    <p className="text-xl font-bold text-primary">฿{getTotal().toFixed(2)}</p>
                    <p className="text-xs text-muted mt-1">PromptPay: {promptPayId || "081-234-5678"}</p>
                  </div>
                )}

                {paymentMethod === "CREDIT_CARD" && (
                  <div className="bg-surface rounded-xl p-4 mb-5 space-y-3 animate-fade-in border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">ชำระด้วยบัตรเครดิต</span>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted mb-1.5 block">หมายเลขอ้างอิง / เลขเซลล์สลิป (ถ้ามี)</label>
                      <input
                        type="text"
                        placeholder="Ref No."
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted mt-2">โปรดทำรายการรูดบัตรตามยอด <span className="font-bold text-primary">฿{getTotal().toFixed(2)}</span> ผ่านเครื่อง EDC ก่อนกดยืนยัน</p>
                  </div>
                )}

                </div>

                {/* Modal Footer (Fixed for Submit Button) */}
                <div className="p-6 pt-0 shrink-0 mt-2">
                  <button
                    onClick={handleConfirmOrder}
                    disabled={paymentMethod === "CASH" && cashReceived < getTotal()}
                    className={`w-full py-3.5 font-bold rounded-xl transition-all duration-200 
                      ${paymentMethod === "CASH" && cashReceived < getTotal() 
                        ? "bg-surface-hover text-muted cursor-not-allowed" 
                        : "bg-success hover:bg-green-600 text-white hover:shadow-lg active:scale-[0.98]"}`}
                    style={paymentMethod === "CASH" && cashReceived < getTotal() ? {} : { boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)" }}
                  >
                    {t("pos.checkout.confirm")} ฿{getTotal().toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden Receipt for Printing */}
      <ReceiptPrint order={completedOrder} />
    </div>
  );
}
