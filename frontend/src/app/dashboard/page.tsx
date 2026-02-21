"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Download,
  BarChart as BarChartIcon
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useOrderStore } from "@/stores/orderStore";
import { useProductStore } from "@/stores/productStore";
import { Product } from "@/types";

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState<'DAY' | 'MONTH' | 'YEAR'>('DAY');
  const [chartMetric, setChartMetric] = useState<'REVENUE' | 'ORDERS'>('REVENUE');
  const { orders } = useOrderStore();
  const { products } = useProductStore();

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      if (order.status !== 'COMPLETED') return false;
      const orderDate = new Date(order.createdAt);
      if (timeFilter === 'DAY') {
        return orderDate.getDate() === now.getDate() &&
               orderDate.getMonth() === now.getMonth() &&
               orderDate.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'MONTH') {
        return orderDate.getMonth() === now.getMonth() &&
               orderDate.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'YEAR') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, timeFilter]);

  const { revenue, orderCount } = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      return {
        revenue: acc.revenue + order.total,
        orderCount: acc.orderCount + 1,
      };
    }, { revenue: 0, orderCount: 0 });
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    const now = new Date();

    if (timeFilter === 'DAY') {
      for (let i = 0; i < 24; i++) {
        data[`${i.toString().padStart(2, '0')}:00`] = 0;
      }
      filteredOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        data[`${hour.toString().padStart(2, '0')}:00`] += chartMetric === 'REVENUE' ? order.total : 1;
      });
    } else if (timeFilter === 'MONTH') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        data[i.toString()] = 0;
      }
      filteredOrders.forEach(order => {
        const day = new Date(order.createdAt).getDate();
        data[day.toString()] += chartMetric === 'REVENUE' ? order.total : 1;
      });
    } else if (timeFilter === 'YEAR') {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      months.forEach(m => data[m] = 0);
      filteredOrders.forEach(order => {
        const monthIndex = new Date(order.createdAt).getMonth();
        data[months[monthIndex]] += chartMetric === 'REVENUE' ? order.total : 1;
      });
    }

    return Object.entries(data).map(([name, total]) => ({ name, total }));
  }, [filteredOrders, timeFilter, chartMetric]);

  const productPieData = useMemo(() => {
    const data: Record<string, { name: string; value: number }> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!item.product) return;
        if (!data[item.productId]) {
          data[item.productId] = { name: item.product.name, value: 0 };
        }
        if (chartMetric === 'REVENUE') {
          data[item.productId].value += item.subtotal;
        } else {
          data[item.productId].value += item.quantity;
        }
      });
    });
    // Return top 8 products, group the rest into "Other"
    const sorted = Object.values(data).sort((a, b) => b.value - a.value);
    if (sorted.length > 8) {
      const top8 = sorted.slice(0, 7);
      const otherValue = sorted.slice(7).reduce((acc, curr) => acc + curr.value, 0);
      return [...top8, { name: 'อื่นๆ', value: otherValue }];
    }
    return sorted;
  }, [filteredOrders, chartMetric]);

  const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9'];

  const topProducts = useMemo(() => {
    const productSales: Record<string, { product: Product; sold: number; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!item.product) return;
        if (!productSales[item.productId]) {
          productSales[item.productId] = { product: item.product, sold: 0, revenue: 0 };
        }
        productSales[item.productId].sold += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map((item, index) => ({
        rank: index + 1,
        name: item.product.name,
        sold: item.sold,
        revenue: item.revenue,
      }));
  }, [filteredOrders]);

  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock < 10).map(p => ({
      name: p.name,
      stock: p.stock,
      color: p.stock <= 5 ? "#dc2626" : "#f59e0b" // Red if very low, Orange if warning
    }));
  }, [products]);

  const filterLabels = {
    DAY: "วันนี้",
    MONTH: "เดือนนี้",
    YEAR: "ปีนี้"
  };

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออกในช่างเวลานี้");
      return;
    }

    const headers = ["Order Number", "Date", "Items", "Subtotal", "Discount", "Tax", "Total", "Payment Method", "Cashier"];
    const rows = filteredOrders.map(order => [
      order.orderNumber,
      new Date(order.createdAt).toLocaleString(),
      order.items.map(i => `${i.product?.name || 'Unknown Item'} (x${i.quantity})`).join(" | "),
      order.subtotal.toFixed(2),
      order.discount.toFixed(2),
      order.tax.toFixed(2),
      order.total.toFixed(2),
      order.paymentMethod,
      order.user?.name || "System"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${timeFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summaryCards = [
    {
      id: 'REVENUE',
      title: `ยอดขาย${filterLabels[timeFilter]}`,
      value: `฿${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      change: "Active",
      icon: DollarSign,
      color: "#22c55e",
      gradient: "from-green-500/20 to-emerald-500/5",
    },
    {
      id: 'ORDERS',
      title: `จำนวนออเดอร์${filterLabels[timeFilter]}`,
      value: orderCount.toString(),
      change: "Active",
      icon: ShoppingCart,
      color: "#6366f1",
      gradient: "from-indigo-500/20 to-violet-500/5",
    },
    {
      id: 'PRODUCTS',
      title: "สินค้าทั้งหมด",
      value: products.length.toString(),
      change: "Active",
      icon: Package,
      color: "#3b82f6",
      gradient: "from-blue-500/20 to-cyan-500/5",
    },
    {
      id: 'LOW_STOCK',
      title: "สินค้าใกล้หมด",
      value: lowStockItems.length.toString(),
      change: "ต่ำกว่า 10 ชิ้น",
      icon: AlertTriangle,
      color: "#f59e0b",
      gradient: "from-amber-500/20 to-yellow-500/5",
    },
  ];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แดชบอร์ด</h1>
          <p className="text-sm text-muted mt-1">ภาพรวมร้านค้าของคุณ</p>
        </div>
        
        {/* Toggle Filters & Export */}
        <div className="flex gap-3">
          <div className="flex bg-surface rounded-xl p-1 border border-border/50">
            {(['DAY', 'MONTH', 'YEAR'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  timeFilter === filter 
                    ? "bg-primary text-white shadow-md" 
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <Calendar className="w-4 h-4" />
                {filterLabels[filter]}
              </button>
            ))}
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-green-600 text-white rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const isChartToggle = card.id === 'REVENUE' || card.id === 'ORDERS';
          const isLink = card.id === 'PRODUCTS' || card.id === 'LOW_STOCK';
          const isActive = isChartToggle && chartMetric === card.id;

          const CardContent = (
            <div
              className={`glass rounded-2xl p-5 bg-gradient-to-br ${card.gradient} transition-all duration-200 h-full
                ${isChartToggle ? 'cursor-pointer hover:scale-[1.02]' : ''} 
                ${isLink ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-primary/50' : ''}
                ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              onClick={() => isChartToggle && setChartMetric(card.id as 'REVENUE' | 'ORDERS')}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <span
                  className="flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-lg"
                  style={{ color: card.color, background: `${card.color}15` }}
                >
                  {card.change}
                  {card.change.startsWith("+") && (
                    <ArrowUpRight className="w-3 h-3" />
                  )}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">{card.value}</h3>
              <p className="text-xs text-muted mt-1">{card.title}</p>
            </div>
          );

          if (isLink) {
            return (
              <Link href="/products" key={card.title} className="block">
                {CardContent}
              </Link>
            );
          }

          return <div key={card.title}>{CardContent}</div>;
        })}
      </div>

      {/* Sales Charts Row 1: Line and Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Line Chart */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">
              แนวโน้ม ({chartMetric === 'REVENUE' ? 'ยอดขาย' : 'ออเดอร์'})
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3b82f620" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8b8bb5' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8b8bb5' }} tickFormatter={(value) => chartMetric === 'REVENUE' ? `฿${value}` : value} />
                <Tooltip
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#2b2b40', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [chartMetric === 'REVENUE' ? `฿${Number(value || 0).toFixed(2)}` : value, chartMetric === 'REVENUE' ? 'ยอดขาย' : 'จำนวนออเดอร์']}
                />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#1e1e2d', strokeWidth: 2, stroke: '#6366f1' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-6">
            <BarChartIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-foreground">
              เปรียบเทียบ ({chartMetric === 'REVENUE' ? 'ยอดขาย' : 'ออเดอร์'})
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3b82f620" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8b8bb5' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8b8bb5' }} tickFormatter={(value) => chartMetric === 'REVENUE' ? `฿${value}` : value} />
                <Tooltip
                  cursor={{ fill: '#6366f115' }}
                  contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#2b2b40', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [chartMetric === 'REVENUE' ? `฿${Number(value || 0).toFixed(2)}` : value, chartMetric === 'REVENUE' ? 'ยอดขาย' : 'จำนวนออเดอร์']}
                />
                <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={timeFilter === 'MONTH' ? 12 : 30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Top Products */}
        <div className="lg:col-span-1 glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">สินค้าขายดี (30 วัน)</h2>
          </div>
          <div className="space-y-3">
            {topProducts.map((product) => (
              <div
                key={product.rank}
                className="flex items-center gap-4 bg-surface rounded-xl p-3 hover:bg-surface-hover transition-colors"
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    product.rank <= 3
                      ? "bg-primary/20 text-primary"
                      : "bg-surface text-muted"
                  }`}
                >
                  {product.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted">ขายแล้ว {product.sold} ชิ้น</p>
                </div>
                <span className="font-semibold text-xs text-primary">
                  ฿{product.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Pie Chart */}
        <div className="glass rounded-2xl p-5">
           <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">
              สัดส่วนสินค้า ({chartMetric === 'REVENUE' ? 'จากยอดขาย' : 'จากจำนวนที่ขาย'})
            </h2>
          </div>
          <div className="h-[300px] w-full">
            {productPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productPieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#8b8bb5', strokeWidth: 1 }}
                  >
                    {productPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#2b2b40', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [chartMetric === 'REVENUE' ? `฿${Number(value || 0).toFixed(2)}` : `${value} ชิ้น`, '']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted text-sm">
                ไม่มีข้อมูลการขาย
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="font-bold text-foreground">สินค้าใกล้หมด</h2>
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between bg-surface rounded-xl p-3"
              >
                <span className="text-sm text-foreground">{item.name}</span>
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-lg"
                  style={{ color: item.color, background: `${item.color}20` }}
                >
                  {item.stock} ชิ้น
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
