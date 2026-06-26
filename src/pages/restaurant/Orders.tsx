import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { ArrowLeft, Search } from 'lucide-react';

export default function RestaurantOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [restaurantId, setRestaurantId] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('restaurants').select('id').eq('owner_id', user.id).single().then(({ data }) => {
      if (!data) { navigate('/restaurant/profile'); return; }
      setRestaurantId(data.id);
      loadOrders(data.id);
    });
  }, [user]);

  const loadOrders = async (rid: string) => {
    const { data } = await supabase.from('orders').select('*').eq('restaurant_id', rid).order('created_at', { ascending: false }).limit(100);
    if (data) setOrders(data);
    setLoading(false);
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/restaurant/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">All Orders</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === s ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-sm text-gray-600 mb-1">Deliver to: {order.delivery_address}</p>
              <p className="text-sm text-gray-600 mb-1">Payment: {order.payment_option}% upfront</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="font-bold text-primary-500">KES {order.total_amount?.toFixed(0)}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-gray-500 py-12">No orders found</p>}
        </div>
      </div>
    </div>
  );
}
