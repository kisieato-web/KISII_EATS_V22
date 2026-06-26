import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import OrderStatusBadge from '../components/OrderStatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

interface Order {
  id: string;
  restaurant_id: string;
  status: string;
  total_amount: number;
  amount_paid_upfront: number;
  amount_remaining: number;
  delivery_address: string;
  created_at: string;
  restaurant?: { name: string };
}

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    supabase.from('orders')
      .select('id, restaurant_id, status, total_amount, amount_paid_upfront, amount_remaining, delivery_address, created_at, restaurant:restaurants(name)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setOrders(data as unknown as Order[]);
        setLoading(false);
      });

    const channel = supabase.channel('orders-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${user?.id}`,
      }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, navigate]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar title="My Orders" />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {(order.restaurant as any)?.name || 'Restaurant'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order #{order.id.slice(0, 8)}</span>
                  <span className="font-bold text-primary-500">KES {order.total_amount?.toFixed(0)}</span>
                </div>
                {order.amount_remaining > 0 && (
                  <p className="text-xs text-orange-500 mt-2">Remaining: KES {order.amount_remaining.toFixed(0)} (pay on delivery)</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Deliver to: {order.delivery_address}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
