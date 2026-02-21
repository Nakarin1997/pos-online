import { Order } from "@/types";

interface ReceiptPrintProps {
  order: Order | null;
}

export function ReceiptPrint({ order }: ReceiptPrintProps) {
  if (!order) return null;

  return (
    <div id="printable-receipt" className="hidden print:block font-mono bg-white text-black text-sm">
      <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-4">
        <h2 className="text-xl font-bold mb-1">POS Online</h2>
        <p className="text-xs text-gray-600 mb-2">ใบเสร็จรับเงิน / Receipt</p>
        <div className="text-left text-xs space-y-1">
          <p>วันที่: {new Date(order.createdAt).toLocaleString('th-TH')}</p>
          <p>เลขที่: {order.orderNumber}</p>
          <p>แคชเชียร์: {order.user?.name || "System"}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4 border-b border-dashed border-gray-400 pb-4">
        <div className="flex justify-between text-xs font-bold border-b border-gray-300 pb-1 mb-2">
          <span>รายการ</span>
          <span>รวม</span>
        </div>
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between items-start text-xs">
            <div className="flex-1 pr-2">
              <p className="font-medium whitespace-pre-wrap">{item.product?.name || "Unknown Item"}</p>
              <p className="text-gray-500">
                {item.quantity} x ฿{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right whitespace-nowrap pt-1">
              ฿{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 mb-4 border-b border-dashed border-gray-400 pb-4 text-xs">
        <div className="flex justify-between">
          <span>รวมเป็นเงิน</span>
          <span>฿{order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>ส่วนลด</span>
            <span>- ฿{order.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>มูลค่าสินค้า (Before VAT)</span>
          <span>฿{(order.total - order.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
          <span>฿{order.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-gray-300">
          <span>ยอดชำระสุทธิ (Total)</span>
          <span>฿{order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="text-center text-xs">
        <p>ชำระโดย: {order.paymentMethod === 'CASH' ? 'เงินสด' : order.paymentMethod === 'CREDIT_CARD' ? 'บัตรเครดิต' : 'QR Code'}</p>
        <p className="mt-4 font-bold">ขอบคุณที่ใช้บริการ</p>
        <p className="mt-1">Thank You</p>
      </div>
    </div>
  );
}
