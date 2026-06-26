import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { ArrowLeft } from 'lucide-react';

export default function RiderDeliveries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('orders').select('*, restaurant:restaurants(name)').eq('rider_id', user.id).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setOrders(data); setLoading(false); });
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/rider/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Delivery History</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">{order.restaurant?.name}</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-sm text-gray-600">To: {order.delivery_address}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="font-bold text-primary-500">KES {order.rider_payout?.toFixed(0)}</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-center text-gray-500 py-12">No deliveries yet</p>}
        </div>
      </div>
    </div>
  );
}
