"use client";

import { useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, X, Check, Package } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useProductStore } from "@/stores/productStore";
import { useOrderStore } from "@/stores/orderStore";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores/languageStore";
import { PaymentMethod, Order } from "@/types";
import { ReceiptPrint } from "@/components/pos/ReceiptPrint";
import { useMemberStore, Member } from "@/stores/memberStore";
import { usePromoStore } from "@/stores/promoStore";

const paymentMethods: Array<{ method: PaymentMethod; label: string; icon: React.ElementType }> = [
  { method: "CASH", label: "เงินสด", icon: Banknote },
  { method: "CREDIT_CARD", label: "บัตรเครดิต", icon: CreditCard },
  { method: "PROMPTPAY", label: "พร้อมเพย์", icon: QrCode },
];

export default function POSPage() {
  const { products, categories, deductStock } = useProductStore();
  const { t } = useLanguageStore();
  const allCategories = [{ id: "all", name: t("pos.filterAll"), color: "#6366f1", isActive: true }, ...categories];
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Members and Promotions State
  const members = useMemberStore((state) => state.members);
  const addPoints = useMemberStore((state) => state.addPoints);
  const promotions = usePromoStore((state) => state.promotions);

  const [memberPhone, setMemberPhone] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<string>("");

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
    
    // Auto-calculate promo if applied initially
    applyPromoDiscount(selectedPromo);
    
    setShowCheckout(true);
  };

  const applyPromoDiscount = (promoId: string) => {
    const subtotal = getSubtotal();
    if (promoId) {
      const promo = promotions.find(p => p.id === promoId);
      if (promo && subtotal >= promo.minSpend) {
        if (promo.type === 'DISCOUNT_AMOUNT') {
          setDiscount(promo.value);
        } else if (promo.type === 'DISCOUNT_PERCENT') {
          setDiscount(subtotal * (promo.value / 100));
        }
      } else {
        setDiscount(0);
      }
    } else {
      setDiscount(0);
    }
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

  const { addOrder } = useOrderStore();
  const { user } = useAuthStore();

  const handleConfirmOrder = () => {
    const finalTotal = getTotal();
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
      subtotal: getSubtotal(),
      discount,
      tax: getTax(),
      total: finalTotal,
      paymentMethod,
      status: "COMPLETED",
      userId: user?.id || "unknown",
      memberId: selectedMember?.id,
      promoId: selectedPromo || undefined,
      user: user ? { id: user.id, name: user.name } : undefined,
      items: items.map((item) => ({
        id: `oi_${Date.now()}_${item.product.id}`,
        productId: item.product.id,
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: item.product.price * item.quantity,
      })),
      createdAt: new Date().toISOString(),
    };

    addOrder(newOrder);

    // Deduct Stock
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
    setCompletedOrder(null);
    setMemberPhone("");
    setSelectedMember(null);
    setSelectedPromo("");
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
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addItem(product)}
                className="glass rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:glow-primary active:scale-[0.98] group animate-fade-in"
              >
                <div
                  className="w-full aspect-square rounded-xl mb-3 flex items-center justify-center text-3xl"
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
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {product.name}
                </h3>
                <p className="text-xs text-muted mt-1">{product.sku}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-primary font-bold">
                    ฿{product.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted">{t("pos.stock")} {product.stock}</span>
                </div>
              </button>
            ))}
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
            </div>
          )}
        </div>

        {/* Cart Footer */}
          <div className="p-5 border-t border-border space-y-3">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted whitespace-nowrap">{t("pos.cart.discount")}:</label>
              <input
                type="number"
                min={0}
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all"
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
                <span>VAT 7%</span>
                <span>฿{getTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>รวมทั้งหมด</span>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in">
            {orderComplete ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t("pos.checkout.success")}</h3>
                <p className="text-muted mb-6">{t("pos.checkout.successDesc")}</p>
                <div className="flex gap-3 justify-center">
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
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-foreground">{t("pos.checkout.title")}</h3>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
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
                      <div className="mt-2 text-xs text-primary font-medium flex justify-between">
                        <span>{selectedMember.name} (ระดับ: {selectedMember.tier})</span>
                        <span>แต้มที่มี: {selectedMember.points.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Promotions */}
                  <div>
                    <label className="text-xs font-medium text-muted mb-1.5 block">โปรโมชั่นที่ใช้ได้</label>
                    <select
                      value={selectedPromo}
                      onChange={(e) => {
                        setSelectedPromo(e.target.value);
                        applyPromoDiscount(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="">-- ไม่ใช้โปรโมชั่น --</option>
                      {promotions.filter(p => p.status === 'ACTIVE' && getSubtotal() >= p.minSpend).map(promo => (
                        <option key={promo.id} value={promo.id}>
                          {promo.name} {promo.minSpend > 0 ? `(ขั้นต่ำ ${promo.minSpend}฿)` : ''}
                        </option>
                      ))}
                    </select>
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

                {/* Order Summary */}
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
                  <div className="flex justify-between text-muted">
                    <span>VAT 7%</span>
                    <span>฿{getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                    <span>{t("pos.cart.total")}</span>
                    <span className="text-primary">฿{getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmOrder}
                  className="w-full py-3.5 bg-success hover:bg-green-600 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                  style={{ boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)" }}
                >
                  {t("pos.checkout.confirm")} ฿{getTotal().toFixed(2)}
                </button>
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
