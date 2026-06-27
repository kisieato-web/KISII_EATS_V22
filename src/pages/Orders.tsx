import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import OrderStatusBadge from '../components/OrderStatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ReviewModal from '../components/ReviewModal';
import { Phone, MessageCircle } from 'lucide-react';

interface Order {
  id: string;
  restaurant_id: string;
  rider_id: string;
  status: string;
  total_amount: number;
  amount_paid_upfront: number;
  amount_remaining: number;
  delivery_address: string;
  delivery_distance_km: number;
  customer_confirmed_delivery: boolean;
  created_at: string;
  restaurant?: { name: string; phone: string };
  rider?: { full_name: string; phone: string };
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '📋' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'ready', label: 'Ready', icon: '📦' },
  { key: 'picked_up', label: 'Picked Up', icon: '🏍️' },
  { key: 'in_transit', label: 'On the Way', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', icon: '🎉' },
];
const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered'];

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }

    loadOrders();
    const channel = supabase.channel('orders-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` }, () => loadOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading, navigate]);

  const loadOrders = () => {
    supabase.from('orders')
      .select('*, restaurant:restaurants(name, phone), rider:users!orders_rider_id_fkey(full_name, phone)')
      .eq('customer_id', user!.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data as unknown as Order[]);
        setLoading(false);
      });
  };

  const handleCall = (phone: string) => window.open(`tel:${phone}`, '_blank');
  const handleWhatsApp = (phone: string) => window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');

  const handleConfirmDelivery = async (orderId: string) => {
    await supabase.from('orders').update({ customer_confirmed_delivery: true, customer_confirmed_at: new Date().toISOString() }).eq('id', orderId);
    loadOrders();
  };

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar title="My Orders" />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No orders yet</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-500 font-medium">Browse Restaurants</button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const currentStepIndex = STATUS_ORDER.indexOf(order.status);
              const isCancelled = order.status === 'cancelled';
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{order.restaurant?.name || 'Restaurant'}</p>
                        <p className="text-xs text-gray-500">Order #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total</span>
                      <span className="font-bold text-primary-500">KES {order.total_amount?.toFixed(0) || '0'}</span>
                    </div>
                    {order.amount_remaining > 0 && (
                      <p className="text-xs text-orange-500 mt-1">⚠️ Pay KES {order.amount_remaining?.toFixed(0)} on delivery</p>
                    )}
                  </div>
                  {!isCancelled && (
                    <div className="p-4">
                      <div className="relative">
                        {STATUS_STEPS.map((step, index) => {
                          const isCompleted = index <= currentStepIndex;
                          const isCurrent = index === currentStepIndex;
                          return (
                            <div key={step.key} className="flex items-start mb-3 last:mb-0">
                              {index < STATUS_STEPS.length - 1 && (
                                <div className={`absolute left-[14px] w-0.5 ${index < currentStepIndex ? 'bg-primary-500' : 'bg-gray-200'}`} style={{ top: '28px', height: '32px' }} />
                              )}
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-sm ${isCompleted ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'} ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}>
                                {isCompleted ? '✓' : index + 1}
                              </div>
                              <div className="ml-3">
                                <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.icon} {step.label}</p>
                                {isCurrent && <p className="text-xs text-primary-500 animate-pulse">In progress...</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {order.rider && order.rider.full_name && ['picked_up', 'in_transit', 'delivered'].includes(order.status) && (
                    <div className="mx-4 mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-sm font-medium text-gray-900 mb-2">🏍️ Your Rider: <span className="text-blue-600">{order.rider.full_name}</span></p>
                      {order.rider.phone && (
                        <div className="flex gap-2">
                          <button onClick={() => handleCall(order.rider!.phone)} className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg text-sm font-medium"><Phone size={16} /> Call</button>
                          <button onClick={() => handleWhatsApp(order.rider!.phone)} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg text-sm font-medium"><MessageCircle size={16} /> WhatsApp</button>
                        </div>
                      )}
                    </div>
                  )}
                  {order.delivery_distance_km > 0 && <p className="px-4 pb-2 text-xs text-gray-400">📍 {order.delivery_address} • {order.delivery_distance_km?.toFixed(1)} km</p>}
                  {order.status === 'delivered' && (
                    <div className="px-4 pb-4 space-y-2">
                      {!order.customer_confirmed_delivery && (
                        <button onClick={() => handleConfirmDelivery(order.id)} className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl">✅ Confirm I Received My Order</button>
                      )}
                      <button onClick={() => navigate(`/restaurant/${order.restaurant_id}`)} className="w-full border-2 border-primary-500 text-primary-500 font-semibold py-2 rounded-xl text-sm">🔄 Reorder</button>
                      <button onClick={() => setReviewOrder(order)} className="w-full border-2 border-yellow-500 text-yellow-600 font-semibold py-2 rounded-xl text-sm">⭐ Rate this Order</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
      {reviewOrder && (
        <ReviewModal
          orderId={reviewOrder.id}
          restaurantId={reviewOrder.restaurant_id}
          riderId={reviewOrder.rider_id}
          onClose={() => setReviewOrder(null)}
          onSubmitted={() => { setReviewOrder(null); loadOrders(); }}
        />
      )}
    </div>
  );
}
