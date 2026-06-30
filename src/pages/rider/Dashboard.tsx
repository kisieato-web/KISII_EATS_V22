import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ToggleLeft, ToggleRight, Package, DollarSign, User, MapPin, Clock } from 'lucide-react';

export default function RiderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadRiderData();
    subscribeOrders();
  }, [user]);

  const loadRiderData = async () => {
    const { data: rp } = await supabase.from('rider_profiles').select('*').eq('user_id', user!.id).single();
    if (!rp) { navigate('/rider/profile'); return; }
    setProfile(rp);

    if (rp.status !== 'approved') {
      setLoading(false);
      return;
    }

    const { data: available } = await supabase.from('orders').select('*, restaurant:restaurants(name, address)').eq('status', 'ready').is('rider_id', null);
    if (available) setAvailableOrders(available);

    const { data: active } = await supabase.from('orders').select('*, pickup_pin, restaurant:restaurants(name, address, phone), customer:users!orders_customer_id_fkey(full_name, phone)').eq('rider_id', user!.id).not('status', 'in ("delivered","cancelled")').single();
    if (active) setActiveDelivery(active);

    const today = new Date().toISOString().split('T')[0];
    const { data: todayOrders } = await supabase.from('orders').select('rider_payout').eq('rider_id', user!.id).eq('status', 'delivered').gte('created_at', today);
    if (todayOrders) setTodayEarnings(todayOrders.reduce((s, o) => s + (o.rider_payout || 0), 0));

    setLoading(false);
  };

  const subscribeOrders = () => {
    supabase.channel('rider-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadRiderData())
      .subscribe();
  };

  const toggleOnline = async () => {
    const newState = !profile.is_online;
    await supabase.from('rider_profiles').update({ is_online: newState }).eq('user_id', user!.id);
    setProfile({ ...profile, is_online: newState });
  };

  const acceptOrder = async (orderId: string) => {
    await supabase.from('orders').update({ rider_id: user!.id, status: 'picked_up' }).eq('id', orderId).eq('rider_id', null).eq('status', 'ready');
    loadRiderData();
  };

  const confirmPickup = async () => {
    await supabase.from('orders').update({ rider_confirmed_pickup: true, rider_confirmed_at: new Date().toISOString(), status: 'in_transit' }).eq('id', activeDelivery.id);
    loadRiderData();
  };

  const confirmDelivery = async () => {
    await supabase.from('orders').update({ status: 'delivered', customer_confirmed_delivery: true, customer_confirmed_at: new Date().toISOString() }).eq('id', activeDelivery.id);
    setActiveDelivery(null);
    loadRiderData();
  };

  if (loading) return <LoadingSpinner />;

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-warm-100 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Clock size={48} className="text-yellow-500 mx-auto mb-4" />
          <h1 className="font-display font-bold text-xl text-gray-900 mb-2">Account Under Review</h1>
          <p className="text-gray-500">Your rider application is being reviewed. You'll be notified once approved.</p>
        </div>
      </div>
    );
  }

  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-warm-100 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-display font-bold text-xl text-red-500 mb-2">Application Rejected</h1>
          <p className="text-gray-500">{profile.rejection_reason || 'Contact admin for more information.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-gray-900">Rider Dashboard</h1>
            <p className="text-sm text-gray-500">KES {todayEarnings.toFixed(0)} today</p>
          </div>
          <button onClick={toggleOnline} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${profile?.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {profile?.is_online ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {profile?.is_online ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {activeDelivery && (
          <div className="bg-primary-500 text-white rounded-2xl p-6 mb-6">
            <h2 className="font-display font-bold text-lg mb-4">Active Delivery</h2>
            <div className="space-y-2 mb-4">
              <p className="flex items-center gap-2"><MapPin size={16} /> Pickup: {activeDelivery.restaurant?.name}</p>
              <p className="flex items-center gap-2"><MapPin size={16} /> Dropoff: {activeDelivery.delivery_address}</p>
              <p className="font-bold">Earn: KES {activeDelivery.rider_payout?.toFixed(0)}</p>
              {activeDelivery.amount_remaining > 0 && (
                <p className="text-yellow-200 text-sm">Collect KES {activeDelivery.amount_remaining.toFixed(0)} from customer</p>
              )}
            </div>
            {activeDelivery.rider_confirmed_pickup && activeDelivery.customer && (
              <div className="bg-white/20 rounded-xl p-3 mb-4">
                <p className="text-sm font-medium mb-2">📞 Customer: {activeDelivery.customer?.full_name}</p>
                {activeDelivery.customer?.phone && (
                  <div className="flex gap-2">
                    <a href={`tel:${activeDelivery.customer.phone}`} className="flex-1 flex items-center justify-center gap-1 bg-white text-green-600 py-2 rounded-lg text-xs font-bold">📞 Call</a>
                    <a href={`https://wa.me/${activeDelivery.customer.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 bg-white text-green-700 py-2 rounded-lg text-xs font-bold">💬 WhatsApp</a>
                  </div>
                )}
              </div>
            )}
            {!activeDelivery.rider_confirmed_pickup ? (
              <button onClick={confirmPickup} className="w-full bg-white text-primary-500 font-semibold py-3 rounded-xl">Confirm Pickup</button>
            ) : (
              <button onClick={confirmDelivery} className="w-full bg-white text-green-600 font-semibold py-3 rounded-xl">Mark Delivered</button>
            )}
          </div>
        )}

        {!activeDelivery && profile?.is_online && (
          <>
            <h2 className="font-semibold text-lg text-gray-900 mb-3">Available Deliveries</h2>
            <div className="space-y-3">
              {availableOrders.map(order => (
                <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="font-semibold text-gray-900 mb-1">{order.restaurant?.name}</p>
                  <p className="text-sm text-gray-600 mb-1">Dropoff: {order.delivery_address}</p>
                  <p className="text-sm text-gray-600 mb-3">Distance: {order.delivery_distance_km?.toFixed(1)} km</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary-500">KES {order.rider_payout?.toFixed(0)}</span>
                    <button onClick={() => acceptOrder(order.id)} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Accept</button>
                  </div>
                </div>
              ))}
              {availableOrders.length === 0 && <p className="text-center text-gray-500 py-8">No deliveries available right now</p>}
            </div>
          </>
        )}

        {!activeDelivery && !profile?.is_online && (
          <div className="text-center py-20">
            <ToggleLeft size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Go online to receive delivery requests</p>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {[
            { to: '/rider/dashboard', icon: Package, label: 'Home' },
            { to: '/rider/deliveries', icon: Clock, label: 'History' },
            { to: '/rider/earnings', icon: DollarSign, label: 'Earnings' },
            { to: '/rider/profile', icon: User, label: 'Profile' },
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