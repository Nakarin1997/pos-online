"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Calculator,
  ChefHat,
  DollarSign,
  TrendingUp,
  Package,
  Save,
  X,
  AlertCircle,
  ArrowDownToLine,
} from "lucide-react";
import { RecipeIngredient } from "@/types";
import { useProductStore } from "@/stores/productStore";

interface RecipeEntry {
  productId: string;
  productName: string;
  ingredients: RecipeIngredient[];
}

// ── Unit conversion system ──────────────────────────────────
// Groups of related units with conversion factors to the base unit
const unitGroups: Record<string, { base: string; units: Record<string, number> }> = {
  weight: {
    base: "กก.",
    units: { "กก.": 1, "กรัม": 0.001 },
  },
  volume: {
    base: "ลิตร",
    units: { "ลิตร": 1, "มล.": 0.001 },
  },
  condiment: {
    base: "ขวด",
    // 1 ขวด (~750ml) ≈ 50 ช้อนโต๊ะ ≈ 150 ช้อนชา
    units: { "ขวด": 1, "ช้อนโต๊ะ": 1 / 50, "ช้อนชา": 1 / 150 },
  },
};

// Find which group a unit belongs to
function getUnitGroup(unit: string) {
  for (const [, group] of Object.entries(unitGroups)) {
    if (unit in group.units) return group;
  }
  return null;
}

// Get conversion factor from useUnit → buyUnit
// Returns how many buyUnits equal 1 useUnit
function getConversionFactor(buyUnit: string, useUnit: string): number {
  if (buyUnit === useUnit) return 1;
  const group = getUnitGroup(buyUnit);
  if (!group || !(useUnit in group.units)) return 1; // no conversion possible
  // useUnit in buyUnit terms:  useUnit_factor / buyUnit_factor
  return group.units[useUnit] / group.units[buyUnit];
}

// Calculate cost for one ingredient (price × qty × conversion)
function calcIngCost(ing: RecipeIngredient): number {
  const factor = getConversionFactor(ing.buyUnit, ing.useUnit);
  return ing.pricePerUnit * ing.quantityUsed * factor;
}

// Get compatible use-units for a given buy-unit
function getUseUnits(buyUnit: string): string[] {
  const group = getUnitGroup(buyUnit);
  if (group) return Object.keys(group.units);
  return [buyUnit]; // standalone unit e.g. ขวด, กำ, ฟอง
}

// All available buy units
const buyUnitOptions = ["กก.", "กรัม", "ลิตร", "มล.", "ช้อนโต๊ะ", "ช้อนชา", "ขวด", "กำ", "ฟอง", "ถุง", "แผ่น", "ชิ้น"];

// Demo recipes (using buyUnit + useUnit)
const demoRecipes: RecipeEntry[] = [
  {
    productId: "p1",
    productName: "ข้าวผัดกระเพรา",
    ingredients: [
      { id: "r1", name: "หมูสับ", buyUnit: "กก.", useUnit: "กรัม", pricePerUnit: 180, quantityUsed: 150 },
      { id: "r2", name: "ใบกระเพรา", buyUnit: "กำ", useUnit: "กำ", pricePerUnit: 10, quantityUsed: 1 },
      { id: "r3", name: "กระเทียม", buyUnit: "กก.", useUnit: "กรัม", pricePerUnit: 80, quantityUsed: 20 },
      { id: "r4", name: "พริก", buyUnit: "กก.", useUnit: "กรัม", pricePerUnit: 120, quantityUsed: 20 },
      { id: "r5", name: "ข้าวสวย", buyUnit: "กก.", useUnit: "กรัม", pricePerUnit: 40, quantityUsed: 250 },
      { id: "r6", name: "น้ำมันพืช", buyUnit: "ลิตร", useUnit: "มล.", pricePerUnit: 55, quantityUsed: 30 },
      { id: "r7", name: "ซอสปรุงรส", buyUnit: "ขวด", useUnit: "ช้อนโต๊ะ", pricePerUnit: 35, quantityUsed: 1 },
      { id: "r8", name: "น้ำปลา", buyUnit: "ขวด", useUnit: "ช้อนโต๊ะ", pricePerUnit: 30, quantityUsed: 1 },
      { id: "r9", name: "ไข่ดาว", buyUnit: "ฟอง", useUnit: "ฟอง", pricePerUnit: 4, quantityUsed: 1 },
    ],
  },
  {
    productId: "p2",
    productName: "ข้าวมันไก่",
    ingredients: [
      { id: "r10", name: "อกไก่", buyUnit: "กก.", useUnit: "กรัม", pricePerUnit: 120, quantityUsed: 200 },
      { id: "r11", name: "ข้าวหอมมะลิ", buyUnit: "กก.", useUnit: "กรัม", pricePerUnit: 45, quantityUsed: 250 },
      { id: "r12", name: "น้ำมันไก่", buyUnit: "ลิตร", useUnit: "มล.", pricePerUnit: 60, quantityUsed: 20 },
      { id: "r13", name: "แตงกวา", buyUnit: "กก.", useUnit: "กรัม", pricePerUnit: 30, quantityUsed: 50 },
      { id: "r14", name: "ซอสถั่วเหลือง", buyUnit: "ขวด", useUnit: "ช้อนโต๊ะ", pricePerUnit: 40, quantityUsed: 1 },
      { id: "r15", name: "น้ำจิ้ม", buyUnit: "ขวด", useUnit: "ช้อนโต๊ะ", pricePerUnit: 45, quantityUsed: 1 },
    ],
  },
];

let nextIngId = 100;

export default function CostCalculatorPage() {
  const { products, updateProduct } = useProductStore();
  const [recipes, setRecipes] = useState<RecipeEntry[]>(demoRecipes);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<RecipeEntry | null>(demoRecipes[0]);
  const [targetMargin, setTargetMargin] = useState<number>(50);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [showReverse, setShowReverse] = useState(false);
  const [reversePrice, setReversePrice] = useState<string>("");
  const [reverseMargin, setReverseMargin] = useState<number>(50);

  // Calculate total cost for a recipe
  const calcTotalCost = (ingredients: RecipeIngredient[]) =>
    ingredients.reduce((sum, ing) => sum + calcIngCost(ing), 0);

  // Start a new recipe
  const handleStartNewRecipe = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const existing = recipes.find(r => r.productId === selectedProductId);
    if (existing) {
      setActiveRecipe(existing);
      setShowNewRecipe(false);
      return;
    }

    const newRecipe: RecipeEntry = {
      productId: selectedProductId,
      productName: product.name,
      ingredients: [],
    };
    setRecipes(prev => [...prev, newRecipe]);
    setActiveRecipe(newRecipe);
    setShowNewRecipe(false);
  };

  // Add ingredient
  const addIngredient = () => {
    if (!activeRecipe) return;
    const newIng: RecipeIngredient = {
      id: `ring${nextIngId++}`,
      name: "",
      buyUnit: "กก.",
      useUnit: "กรัม",
      pricePerUnit: 0,
      quantityUsed: 0,
    };
    const updated = {
      ...activeRecipe,
      ingredients: [...activeRecipe.ingredients, newIng],
    };
    setActiveRecipe(updated);
    setRecipes(prev => prev.map(r => r.productId === updated.productId ? updated : r));
  };

  // Update ingredient field
  const updateIngredient = (ingId: string, field: keyof RecipeIngredient, value: string | number) => {
    if (!activeRecipe) return;
    const updated = {
      ...activeRecipe,
      ingredients: activeRecipe.ingredients.map(ing => {
        if (ing.id !== ingId) return ing;

        // When buyUnit changes, update useUnit to default
        if (field === "buyUnit") {
          const newBuyUnit = value as string;
          const compatibleUseUnits = getUseUnits(newBuyUnit);
          const currentUseUnitValid = compatibleUseUnits.includes(ing.useUnit);
          return {
            ...ing,
            buyUnit: newBuyUnit,
            useUnit: currentUseUnitValid ? ing.useUnit : compatibleUseUnits[compatibleUseUnits.length - 1] || newBuyUnit,
          };
        }

        return { ...ing, [field]: value };
      }),
    };
    setActiveRecipe(updated);
    setRecipes(prev => prev.map(r => r.productId === updated.productId ? updated : r));
  };

  // Remove ingredient
  const removeIngredient = (ingId: string) => {
    if (!activeRecipe) return;
    const updated = {
      ...activeRecipe,
      ingredients: activeRecipe.ingredients.filter(ing => ing.id !== ingId),
    };
    setActiveRecipe(updated);
    setRecipes(prev => prev.map(r => r.productId === updated.productId ? updated : r));
  };

  // Save cost to product
  const saveCostToProduct = () => {
    if (!activeRecipe) return;
    const totalCost = calcTotalCost(activeRecipe.ingredients);
    updateProduct(activeRecipe.productId, { cost: Math.round(totalCost * 100) / 100 });
    setSavedMsg(`บันทึกต้นทุน ฿${totalCost.toFixed(2)} ให้ "${activeRecipe.productName}" แล้ว`);
    setTimeout(() => setSavedMsg(null), 3000);
  };

  // Reverse calculate: target price → adjust ingredient quantities
  const handleReverseCalc = () => {
    if (!activeRecipe || !reversePrice || activeRecipe.ingredients.length === 0) return;
    const targetPrice = Number(reversePrice);
    if (targetPrice <= 0) return;

    const budget = targetPrice * (1 - reverseMargin / 100);
    const currentCost = calcTotalCost(activeRecipe.ingredients);
    if (currentCost <= 0) return;

    const ratio = budget / currentCost;

    const updated = {
      ...activeRecipe,
      ingredients: activeRecipe.ingredients.map(ing => ({
        ...ing,
        quantityUsed: Math.round(ing.quantityUsed * ratio * 1000) / 1000,
      })),
    };
    setActiveRecipe(updated);
    setRecipes(prev => prev.map(r => r.productId === updated.productId ? updated : r));
    updateProduct(activeRecipe.productId, { price: targetPrice });
    setShowReverse(false);
    setSavedMsg(`ปรับวัตถุดิบให้เหมาะกับราคา ฿${targetPrice} (margin ${reverseMargin}%) แล้ว`);
    setTimeout(() => setSavedMsg(null), 3000);
  };

  // Computed values
  const totalCost = activeRecipe ? calcTotalCost(activeRecipe.ingredients) : 0;
  const reverseBudget = Number(reversePrice) > 0 ? Number(reversePrice) * (1 - reverseMargin / 100) : 0;
  const reverseRatio = activeRecipe && totalCost > 0 ? reverseBudget / totalCost : 0;

  const suggestedPrice = targetMargin > 0 ? totalCost / (1 - targetMargin / 100) : totalCost;
  const currentProduct = activeRecipe ? products.find(p => p.id === activeRecipe.productId) : null;
  const currentProfit = currentProduct ? currentProduct.price - totalCost : 0;
  const currentMargin = currentProduct && currentProduct.price > 0
    ? (currentProfit / currentProduct.price) * 100 : 0;

  const inputClass = "w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

  return (
    <div className="p-6 animate-fade-in">
      {/* Success Banner */}
      {savedMsg && (
        <div className="fixed top-4 right-4 z-50 bg-success/90 text-white px-5 py-3 rounded-xl shadow-lg animate-slide-up flex items-center gap-2">
          <Save className="w-4 h-4" />
          {savedMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <ChefHat className="w-7 h-7 text-primary" />
            คำนวณต้นทุน
          </h1>
          <p className="text-sm text-muted mt-1">คำนวณต้นทุนวัตถุดิบต่อเมนู เพื่อตั้งราคาขายที่เหมาะสม</p>
        </div>
        <button
          onClick={() => setShowNewRecipe(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          style={{ boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)" }}
        >
          <Plus className="w-4 h-4" />
          คำนวณเมนูใหม่
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left: Recipe List */}
        <div className="w-72 shrink-0">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">รายการเมนู</h2>
          <div className="space-y-2">
            {recipes.map((recipe) => {
              const cost = calcTotalCost(recipe.ingredients);
              const product = products.find(p => p.id === recipe.productId);
              const isActive = activeRecipe?.productId === recipe.productId;
              return (
                <button
                  key={recipe.productId}
                  onClick={() => setActiveRecipe(recipe)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-primary/20 border border-primary/50"
                      : "glass hover:bg-surface-hover"
                  }`}
                >
                  <div className="font-medium text-sm text-foreground">{recipe.productName}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted">
                      {recipe.ingredients.length} วัตถุดิบ
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      ต้นทุน ฿{cost.toFixed(2)}
                    </span>
                  </div>
                  {product && (
                    <div className="text-xs text-muted mt-0.5">
                      ราคาขาย ฿{product.price.toFixed(2)}
                    </div>
                  )}
                </button>
              );
            })}
            {recipes.length === 0 && (
              <p className="text-sm text-muted text-center py-4">ยังไม่มีเมนูที่คำนวณ</p>
            )}
          </div>
        </div>

        {/* Right: Active Recipe Detail */}
        <div className="flex-1">
          {activeRecipe ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted text-xs mb-2">
                    <DollarSign className="w-4 h-4" />
                    ต้นทุนรวม
                  </div>
                  <div className="text-xl font-bold text-danger">฿{totalCost.toFixed(2)}</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted text-xs mb-2">
                    <Package className="w-4 h-4" />
                    ราคาขายปัจจุบัน
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    ฿{currentProduct?.price.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted text-xs mb-2">
                    <TrendingUp className="w-4 h-4" />
                    กำไร
                  </div>
                  <div className={`text-xl font-bold ${currentProfit >= 0 ? "text-success" : "text-danger"}`}>
                    ฿{currentProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted">{currentMargin.toFixed(1)}% margin</div>
                </div>
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted text-xs mb-2">
                    <Calculator className="w-4 h-4" />
                    ราคาขายแนะนำ
                  </div>
                  <div className="text-xl font-bold text-primary">฿{suggestedPrice.toFixed(2)}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted">margin</span>
                    <input
                      type="number"
                      value={targetMargin}
                      onChange={(e) => setTargetMargin(Number(e.target.value))}
                      className="w-14 px-1.5 py-0.5 rounded bg-surface border border-border text-xs text-foreground text-center focus:outline-none focus:border-primary"
                      min="0"
                      max="99"
                    />
                    <span className="text-xs text-muted">%</span>
                  </div>
                </div>
              </div>

              {/* Ingredients Table */}
              <div className="glass rounded-2xl overflow-hidden mb-4">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-bold text-foreground">
                    วัตถุดิบ — {activeRecipe.productName}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setReversePrice(currentProduct?.price.toString() || "");
                        setShowReverse(true);
                      }}
                      disabled={activeRecipe.ingredients.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 bg-accent/20 text-accent rounded-lg text-xs font-medium hover:bg-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      ตั้งราคา → ปรับวัตถุดิบ
                    </button>
                    <button
                      onClick={addIngredient}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-xs font-medium hover:bg-primary/30 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      เพิ่มวัตถุดิบ
                    </button>
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-3">ชื่อวัตถุดิบ</th>
                      <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-3 w-32">ราคา/หน่วยซื้อ</th>
                      <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider p-3 w-28">หน่วยซื้อ</th>
                      <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-3 w-32">ปริมาณที่ใช้</th>
                      <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider p-3 w-28">หน่วยใช้</th>
                      <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-3 w-24">ต้นทุน (฿)</th>
                      <th className="text-center text-xs font-semibold text-muted uppercase tracking-wider p-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecipe.ingredients.map((ing) => {
                      const ingCost = calcIngCost(ing);
                      const availableUseUnits = getUseUnits(ing.buyUnit);
                      return (
                        <tr key={ing.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                          {/* Name */}
                          <td className="p-3">
                            <input
                              value={ing.name}
                              onChange={(e) => updateIngredient(ing.id, "name", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-surface text-sm text-foreground focus:outline-none transition-all"
                              placeholder="ชื่อวัตถุดิบ"
                            />
                          </td>
                          {/* Price per buy unit */}
                          <td className="p-3">
                            <div className="relative">
                              <input
                                type="number"
                                value={ing.pricePerUnit || ""}
                                onChange={(e) => updateIngredient(ing.id, "pricePerUnit", parseInt(e.target.value, 10) || 0)}
                                className="w-full px-2 py-1.5 pr-8 rounded-lg bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-surface text-sm text-foreground text-right focus:outline-none transition-all"
                                placeholder="0"
                                min="0"
                                step="1"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
                                /{ing.buyUnit}
                              </span>
                            </div>
                          </td>
                          {/* Buy Unit */}
                          <td className="p-3">
                            <select
                              value={ing.buyUnit}
                              onChange={(e) => updateIngredient(ing.id, "buyUnit", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all text-center"
                            >
                              {buyUnitOptions.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </td>
                          {/* Quantity used */}
                          <td className="p-3">
                            <div className="relative">
                              <input
                                type="number"
                                value={ing.quantityUsed || ""}
                                onChange={(e) => updateIngredient(ing.id, "quantityUsed", parseInt(e.target.value, 10) || 0)}
                                className="w-full px-2 py-1.5 pr-10 rounded-lg bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-surface text-sm text-foreground text-right focus:outline-none transition-all"
                                placeholder="0"
                                min="0"
                                step="1"
                              />
                            </div>
                          </td>
                          {/* Use Unit */}
                          <td className="p-3">
                            {availableUseUnits.length > 1 ? (
                              <select
                                value={ing.useUnit}
                                onChange={(e) => updateIngredient(ing.id, "useUnit", e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all text-center"
                              >
                                {availableUseUnits.map(u => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="block text-sm text-center text-muted">{ing.useUnit}</span>
                            )}
                          </td>
                          {/* Cost */}
                          <td className="p-3 text-right">
                            <span className={`text-sm font-semibold ${ingCost > 0 ? "text-warning" : "text-muted"}`}>
                              ฿{ingCost.toFixed(2)}
                            </span>
                          </td>
                          {/* Delete */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => removeIngredient(ing.id)}
                              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-surface transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {activeRecipe.ingredients.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted text-sm">
                          <AlertCircle className="w-5 h-5 mx-auto mb-2 opacity-50" />
                          ยังไม่มีวัตถุดิบ กดปุ่ม &quot;เพิ่มวัตถุดิบ&quot; เพื่อเริ่มต้น
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {activeRecipe.ingredients.length > 0 && (
                    <tfoot>
                      <tr className="bg-surface/50">
                        <td colSpan={5} className="p-3 text-right font-bold text-foreground text-sm">
                          ต้นทุนรวมต่อจาน
                        </td>
                        <td className="p-3 text-right font-bold text-lg text-danger">
                          ฿{totalCost.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={saveCostToProduct}
                  disabled={activeRecipe.ingredients.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-success hover:bg-green-600 text-white rounded-xl font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)" }}
                >
                  <Save className="w-4 h-4" />
                  บันทึกต้นทุนไปที่สินค้า
                </button>
                {currentProduct && suggestedPrice !== currentProduct.price && (
                  <button
                    onClick={() => {
                      updateProduct(activeRecipe.productId, { price: Math.ceil(suggestedPrice) });
                      setSavedMsg(`อัปเดตราคาขาย ฿${Math.ceil(suggestedPrice).toFixed(2)} ให้ "${activeRecipe.productName}" แล้ว`);
                      setTimeout(() => setSavedMsg(null), 3000);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-sm transition-all hover:shadow-lg"
                  >
                    <TrendingUp className="w-4 h-4" />
                    ใช้ราคาแนะนำ ฿{Math.ceil(suggestedPrice)}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-muted">
              <ChefHat className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">เลือกเมนูเพื่อดูรายละเอียดวัตถุดิบ</p>
              <p className="text-sm mt-1">หรือกดปุ่ม &quot;คำนวณเมนูใหม่&quot; เพื่อเริ่มต้น</p>
            </div>
          )}
        </div>
      </div>

      {/* New Recipe Modal */}
      {showNewRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">เลือกเมนูที่จะคำนวณ</h3>
              <button
                onClick={() => setShowNewRecipe(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className={inputClass}
              >
                <option value="">เลือกสินค้า...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ราคาขาย ฿{p.price})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewRecipe(false)}
                className="flex-1 py-2.5 bg-surface hover:bg-surface-hover text-foreground rounded-xl font-medium text-sm transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleStartNewRecipe}
                disabled={!selectedProductId}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                เริ่มคำนวณ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Calculation Modal */}
      {showReverse && activeRecipe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-lg animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-accent" />
                ตั้งราคา → ปรับวัตถุดิบอัตโนมัติ
              </h3>
              <button
                onClick={() => setShowReverse(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted mb-4">
              ใส่ราคาขายที่ต้องการ ระบบจะปรับปริมาณวัตถุดิบทั้งหมดให้เหมาะสมกับราคาและกำไรที่ตั้งไว้
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">ราคาขายที่ต้องการ (฿)</label>
                <input
                  type="number"
                  value={reversePrice}
                  onChange={(e) => setReversePrice(e.target.value)}
                  className={inputClass}
                  placeholder="เช่น 50"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">% กำไรที่ต้องการ</label>
                <input
                  type="number"
                  value={reverseMargin}
                  onChange={(e) => setReverseMargin(Number(e.target.value))}
                  className={inputClass}
                  min="1"
                  max="90"
                />
              </div>
            </div>

            {Number(reversePrice) > 0 && (
              <div className="bg-surface rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-muted mb-1">งบวัตถุดิบ</div>
                    <div className="text-lg font-bold text-accent">฿{reverseBudget.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-1">กำไร</div>
                    <div className="text-lg font-bold text-success">฿{(Number(reversePrice) - reverseBudget).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-1">ปรับสัดส่วน</div>
                    <div className={`text-lg font-bold ${reverseRatio >= 1 ? 'text-success' : 'text-warning'}`}>
                      {reverseRatio >= 1 ? '↑' : '↓'} {(reverseRatio * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="text-xs font-semibold text-muted uppercase mb-2">ตัวอย่างปริมาณที่ปรับ</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {activeRecipe.ingredients.map(ing => {
                      const newQty = Math.round(ing.quantityUsed * reverseRatio * 1000) / 1000;
                      const newCost = calcIngCost({ ...ing, quantityUsed: newQty });
                      return (
                        <div key={ing.id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{ing.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted line-through text-xs">{ing.quantityUsed} {ing.useUnit}</span>
                            <span className={`font-medium ${reverseRatio >= 1 ? 'text-success' : 'text-warning'}`}>
                              {newQty} {ing.useUnit}
                            </span>
                            <span className="text-xs text-muted w-16 text-right">฿{newCost.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowReverse(false)}
                className="flex-1 py-2.5 bg-surface hover:bg-surface-hover text-foreground rounded-xl font-medium text-sm transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReverseCalc}
                disabled={!reversePrice || Number(reversePrice) <= 0}
                className="flex-1 py-2.5 bg-accent hover:bg-cyan-500 text-black font-semibold rounded-xl text-sm transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 4px 15px rgba(34, 211, 238, 0.3)' }}
              >
                ปรับวัตถุดิบตามราคานี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
