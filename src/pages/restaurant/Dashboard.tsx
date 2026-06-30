import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { ClipboardList, Menu as MenuIcon, DollarSign, Settings, ToggleLeft, ToggleRight, Bell, Package, Tag } from 'lucide-react';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({ orders: 0, revenue: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    supabase.from('restaurants').select('*').eq('owner_id', user.id).maybeSingle().then(({ data, error }) => {
      if (error) {
        console.warn('Unable to load restaurant profile:', error);
        setLoading(false);
        return;
      }

      if (!data) {
        setRestaurant(null);
        setLoading(false);
        return;
      }

      setRestaurant(data);
      loadOrders(data.id);
      subscribeOrders(data.id);
    });
  }, [user]);

  useEffect(() => {
    if (!restaurant?.id) return;
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    const channel = supabase.channel('new-orders-alert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` }, () => {
        audio.play().catch(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant?.id]);

  const loadOrders = async (restaurantId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('orders').select('*, pickup_pin, customer:users!orders_customer_id_fkey(full_name, phone)').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(50);
    if (data) {
      setOrders(data);
      const todayOrders = data.filter(o => o.created_at.startsWith(today));
      setTodayStats({
        orders: todayOrders.length,
        revenue: todayOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
        pending: todayOrders.filter(o => o.status === 'pending').length,
      });
    }
    setLoading(false);
  };

  const subscribeOrders = (restaurantId: string) => {
    supabase.channel('restaurant-orders').on('postgres_changes', {
      event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}`
    }, () => loadOrders(restaurantId)).subscribe();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status, restaurant_confirmed_dispatch: status === 'ready' }).eq('id', orderId);
  };

  const toggleOpen = async () => {
    const newState = !restaurant.is_open;
    await supabase.from('restaurants').update({ is_open: newState }).eq('id', restaurant.id);
    setRestaurant({ ...restaurant, is_open: newState });
  };

  if (loading) return <LoadingSpinner />;

  if (restaurant?.status === 'pending') {
    return (<div className="min-h-screen bg-warm-100 flex items-center justify-center px-4"><div className="text-center max-w-sm"><div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><span className="text-4xl">⏳</span></div><h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Under Review</h1><p className="text-gray-500 mb-4">Your restaurant <strong>{restaurant.name}</strong> is being reviewed. You'll be notified once approved.</p><div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-700"><p>📧 Check your email for updates</p><p>📞 Contact: 0743 053 511</p></div><button onClick={() => navigate('/')} className="mt-6 text-primary-500 font-medium">← Back to Home</button></div></div>);
  }
  if (restaurant?.status === 'rejected') {
    return (<div className="min-h-screen bg-warm-100 flex items-center justify-center px-4"><div className="text-center max-w-sm"><div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><span className="text-4xl">❌</span></div><h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Application Rejected</h1>{restaurant.rejection_reason && <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700 mb-4"><p className="font-medium">Reason:</p><p>{restaurant.rejection_reason}</p></div>}<p className="text-sm text-gray-500">Contact jannesokumu20@gmail.com</p><button onClick={() => navigate('/')} className="mt-6 text-primary-500 font-medium">← Back to Home</button></div></div>);
  }
  if (restaurant?.status === 'suspended') {
    return (<div className="min-h-screen bg-warm-100 flex items-center justify-center px-4"><div className="text-center max-w-sm"><div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><span className="text-4xl">🚫</span></div><h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Account Suspended</h1><p className="text-gray-500">Contact admin for more information.</p><button onClick={() => navigate('/')} className="mt-6 text-primary-500 font-medium">← Back to Home</button></div></div>);
  }

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-gray-900">{restaurant?.name}</h1>
            <p className="text-sm text-gray-500">Restaurant Dashboard</p>
          </div>
          <button onClick={toggleOpen} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${restaurant?.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {restaurant?.is_open ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {restaurant?.is_open ? 'Open' : 'Closed'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{todayStats.orders}</p>
            <p className="text-xs text-gray-500">Today Orders</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-primary-500">KES {todayStats.revenue.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Revenue</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-orange-500">{todayStats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { to: '/restaurant/orders', icon: ClipboardList, label: 'Orders', color: 'bg-blue-100 text-blue-600' },
            { to: '/restaurant/menu', icon: MenuIcon, label: 'Menu', color: 'bg-green-100 text-green-600' },
            { to: '/restaurant/earnings', icon: DollarSign, label: 'Earnings', color: 'bg-yellow-100 text-yellow-600' },
            { to: '/restaurant/profile', icon: Settings, label: 'Settings', color: 'bg-gray-100 text-gray-600' },
            { to: '/restaurant/promotions', icon: Tag, label: 'Promos', color: 'bg-pink-100 text-pink-600' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}><Icon size={22} /></div>
              <span className="text-xs text-gray-600">{label}</span>
            </Link>
          ))}
        </div>

        <h2 className="font-semibold text-lg text-gray-900 mb-3 flex items-center gap-2">
          <Bell size={18} className="text-primary-500" /> Live Orders
        </h2>
        <div className="space-y-3">
          {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).map(order => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              {order.pickup_pin && (
                <p className="text-xs font-bold text-primary-500 tracking-widest mt-0.5">
                  PIN: {order.pickup_pin} — Write on bag
                </p>
              )}
              <p className="text-sm text-gray-600 mb-2">Deliver to: {order.delivery_address}</p>
              {order.customer && <p className="text-sm text-gray-600 mb-2">👤 {order.customer.full_name} • 📞 {order.customer.phone}</p>}
              <p className="font-bold text-primary-500 mb-3">KES {order.total_amount?.toFixed(0)}</p>
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="flex-1 bg-primary-500 text-white text-sm py-2 rounded-lg font-medium">Confirm Order</button>
                )}
                {order.status === 'confirmed' && (
                  <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 bg-orange-500 text-white text-sm py-2 rounded-lg font-medium">Start Preparing</button>
                )}
                {order.status === 'preparing' && (
                  <button onClick={() => updateOrderStatus(order.id, 'ready')} className="flex-1 bg-green-500 text-white text-sm py-2 rounded-lg font-medium">Mark Ready</button>
                )}
              </div>
            </div>
          ))}
          {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length === 0 && (
            <p className="text-center text-gray-500 py-8">No active orders</p>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {[
            { to: '/restaurant/dashboard', icon: Package, label: 'Home' },
            { to: '/restaurant/orders', icon: ClipboardList, label: 'Orders' },
            { to: '/restaurant/menu', icon: MenuIcon, label: 'Menu' },
            { to: '/restaurant/earnings', icon: DollarSign, label: 'Earnings' },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-gray-400">
              <Icon size={20} />{label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
