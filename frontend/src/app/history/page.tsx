"use client";

import { useState, useEffect } from "react";
import { Search, Eye, XCircle, Calendar, Filter, Printer } from "lucide-react";
import { Order } from "@/types";
import { ReceiptPrint } from "@/components/pos/ReceiptPrint";

import { useOrderStore } from "@/stores/orderStore";

const paymentLabels: Record<string, string> = {
  CASH: "เงินสด",
  CREDIT_CARD: "บัตรเครดิต",
  TRANSFER: "โอนเงิน",
  PROMPTPAY: "พร้อมเพย์",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "สำเร็จ", color: "#22c55e" },
  CANCELLED: { label: "ยกเลิก", color: "#ef4444" },
  REFUNDED: { label: "คืนเงิน", color: "#f59e0b" },
};

export default function HistoryPage() {
  const { orders, fetchOrders } = useOrderStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "this-week" | "this-month">("today");
  const [statusFilter, setStatusFilter] = useState<"all" | "COMPLETED" | "CANCELLED" | "REFUNDED">("all");
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    
    let matchDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(o.createdAt);
      const today = new Date();
      if (dateFilter === "today") {
        matchDate = orderDate.toDateString() === today.toDateString();
      } else if (dateFilter === "this-week") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        matchDate = orderDate >= startOfWeek;
      } else if (dateFilter === "this-month") {
        matchDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
      }
    }
    
    return matchSearch && matchStatus && matchDate;
  });

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ประวัติการขาย</h1>
          <p className="text-sm text-muted mt-1">รายการออเดอร์ทั้งหมด</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="ค้นหาเลขออเดอร์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <button 
          onClick={() => {
             const nextDate = dateFilter === 'all' ? 'today' : dateFilter === 'today' ? 'this-week' : dateFilter === 'this-week' ? 'this-month' : 'all';
             setDateFilter(nextDate);
          }} 
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${dateFilter !== 'all' ? 'bg-primary text-white shadow-md' : 'glass text-muted hover:text-foreground'}`}
        >
          <Calendar className="w-4 h-4" />
          {dateFilter === 'all' ? 'ทุกวัน' : dateFilter === 'today' ? 'วันนี้' : dateFilter === 'this-week' ? 'สัปดาห์นี้' : 'เดือนนี้'}
        </button>
        <div className="relative">
          <button 
            onClick={() => setShowStatusFilter(!showStatusFilter)} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${statusFilter !== 'all' ? 'bg-primary text-white shadow-md' : 'glass text-muted hover:text-foreground'}`}
          >
            <Filter className="w-4 h-4" />
            {statusFilter === 'all' ? 'ทุกสถานะ' : statusConfig[statusFilter].label}
          </button>
          {showStatusFilter && (
            <div className="absolute right-0 mt-2 w-40 glass rounded-xl shadow-lg border border-border overflow-hidden z-10 animate-fade-in">
              <button onClick={() => { setStatusFilter("all"); setShowStatusFilter(false); }} className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors">ทุกสถานะ</button>
              <button onClick={() => { setStatusFilter("COMPLETED"); setShowStatusFilter(false); }} className="block w-full text-left px-4 py-2 text-sm text-success hover:bg-success/10 transition-colors">สำเร็จ</button>
              <button onClick={() => { setStatusFilter("CANCELLED"); setShowStatusFilter(false); }} className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors">ยกเลิก</button>
              <button onClick={() => { setStatusFilter("REFUNDED"); setShowStatusFilter(false); }} className="block w-full text-left px-4 py-2 text-sm text-orange-500 hover:bg-orange-500/10 transition-colors">คืนเงิน</button>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">เลขออเดอร์</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">เวลา</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">รายการ</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">พนักงาน</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">ชำระด้วย</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider p-4">สถานะ</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">ยอดรวม</th>
              <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider p-4">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => {
              const status = statusConfig[order.status];
              return (
                <tr
                  key={order.id}
                  className="border-b border-border/50 hover:bg-surface-hover transition-colors"
                >
                  <td className="p-4">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted">
                    {new Date(order.createdAt).toLocaleString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="p-4 text-sm text-muted">
                    {order.items.length} รายการ
                  </td>
                  <td className="p-4 text-sm font-medium text-foreground">
                    {order.user?.name || "-"}
                  </td>
                  <td className="p-4 text-sm text-muted">
                    {paymentLabels[order.paymentMethod]}
                  </td>
                  <td className="p-4">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: `${status.color}20`,
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="p-4 text-right font-semibold text-sm text-foreground">
                    ฿{order.total.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 rounded-lg text-muted hover:text-primary hover:bg-surface transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.status === "COMPLETED" && (
                        <button className="p-2 rounded-lg text-muted hover:text-danger hover:bg-surface transition-all">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-lg animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-muted mt-1">
                  {new Date(selectedOrder.createdAt).toLocaleString("th-TH")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-muted hover:text-primary transition-colors bg-surface rounded-lg border border-border"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-muted hover:text-foreground transition-colors p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 mb-4">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-surface rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.product?.name}</p>
                    <p className="text-xs text-muted">
                      ฿{item.unitPrice.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-sm text-primary">
                    ฿{item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>ยอดรวม</span>
                <span>฿{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-danger">
                  <span>ส่วนลด</span>
                  <span>-฿{selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>VAT 7%</span>
                <span>฿{selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>รวมทั้งหมด</span>
                <span className="text-primary">฿{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Receipt for Printing */}
      <ReceiptPrint order={selectedOrder} />
    </div>
  );
}
