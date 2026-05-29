import { useState } from 'react';
import { Package, RefreshCw, Clock, CheckCircle, XCircle, Truck, ChevronDown, ChevronUp, MapPin, Phone, CreditCard } from 'lucide-react';

// Interfaces matching your UserProfile requirements
interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string | number;
  variant_label: string;
  image_url?: string; // Ensure your API sends this exact field name
}

interface Order {
  id: number;
  order_status: string;
  total_amount: string | number;
  created_at: string;
  shipping_address: string;
  phone: string;
  payment_method: string; 
  payment_status: string; 
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  'Pending':    { label: 'Pending',    color: 'text-amber-700 bg-amber-50 border-amber-200',  icon: Clock },
  'Processing': { label: 'Processing', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: Package },
  'Shipped':    { label: 'Shipped',    color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Truck },
  'Delivered':  { label: 'Delivered',  color: 'text-green-700 bg-green-50 border-green-200',  icon: CheckCircle },
  'Cancelled':  { label: 'Cancelled',  color: 'text-red-700 bg-red-50 border-red-200',      icon: XCircle },
};
export default function OrderHistory({ orders, loading, totalOrders, onRefresh }: any) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const apiBase = 'https://api.sriruchipachallu.in';
  if (loading) return <div className="space-y-4 animate-pulse">{[1,2].map(i => <div key={i} className="h-28 bg-gray-50 rounded-xl"/>)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#1F2B5B]">My Orders ({totalOrders})</h2>
        <button onClick={onRefresh} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3"/> Refresh
        </button>
      </div>

      {orders.map((order: Order) => {
        const isExpanded = expandedId === order.id;
        const statusConfig = STATUS_MAP[order.order_status] || { label: order.order_status, color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Package };
        const StatusIcon = statusConfig.icon;

        return (
          <div key={order.id} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden transition-all">
            <div onClick={() => setExpandedId(isExpanded ? null : order.id)} className="p-4 cursor-pointer hover:bg-gray-50 flex items-start gap-4">
              
              {/* Image Stack */}
              <div className="flex -space-x-4">
                {order.items.slice(0, 2).map((item, i) => {
                  // DEBUG: Check what is inside 'item'
                  console.log("Order Item Data:", item); 
                  return (
                    <img 
  src={item.image_url} // Since your API is now sending the full absolute URL, you don't need apiBase!
  alt={item.product_name}
  className="w-14 h-14 rounded-lg border-2 border-white object-cover bg-gray-100" 
  onError={(e) => { 
    console.error("Image failed to load:", e.currentTarget.src);
    e.currentTarget.src = '/placeholder.png'; 
  }}
/>
                  );
                })}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">
                  {order.items.map(it => `${it.quantity}x ${it.product_name}`).join(', ')}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  {order.items.map(it => it.variant_label).join(' | ')}
                </p>
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border flex items-center gap-1 ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" /> {statusConfig.label}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <CreditCard size={10} />
                        {order.payment_method === 'COD' ? 'COD' : 'Online'}: {order.payment_status}
                    </span>
                </div>
              </div>

              <div className="text-right">
                <p className="font-black text-sm text-[#1F2B5B]">₹{Number(order.total_amount).toLocaleString()}</p>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 mt-2" /> : <ChevronDown className="w-5 h-5 text-gray-400 mt-2" />}
              </div>
            </div>

            {/* EXPANDED SHIPPING DETAILS */}
            {isExpanded && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                <div className="flex gap-4 text-xs text-gray-600">
                    <MapPin className="w-4 h-4 text-[#1F2B5B] flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-bold text-gray-900 mb-0.5">Shipping Address</p>
                        <p className="leading-relaxed">{order.shipping_address}</p>
                        <p className="flex items-center gap-1 mt-2 font-bold text-[#1F2B5B]"><Phone size={12}/> {order.phone}</p>
                    </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}