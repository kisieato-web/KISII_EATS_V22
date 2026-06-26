import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardList, Users, Store, Bike, DollarSign, Settings, Bell, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, riders: 0, restaurants: 0, pendingRiders: 0, pendingRestaurants: 0, pendingDisbursements: 0, pendingPromotions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role !== 'admin') { navigate('/dashboard'); return; }
      loadStats();
    });
  }, [user]);

  const loadStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const [{ data: orders }, { data: riders }, { data: restaurants }, { data: pendingRiders }, { data: pendingRestaurants }, { data: pendingBatches }, { data: pendingPromos }] = await Promise.all([
      supabase.from('orders').select('total_amount').gte('created_at', today),
      supabase.from('rider_profiles').select('id', { count: 'exact' }).eq('status', 'approved'),
      supabase.from('restaurants').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('rider_profiles').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('restaurants').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('disbursement_batches').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('promotions').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]);
    setStats({
      orders: orders?.length || 0,
      revenue: orders?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0,
      riders: (riders as any)?.length || 0,
      restaurants: (restaurants as any)?.length || 0,
      pendingRiders: (pendingRiders as any)?.length || 0,
      pendingRestaurants: (pendingRestaurants as any)?.length || 0,
      pendingDisbursements: (pendingBatches as any)?.length || 0,
      pendingPromotions: (pendingPromos as any)?.length || 0,
    });
    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display font-bold text-xl text-gray-900">Admin Dashboard</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-2xl font-bold">{stats.orders}</p><p className="text-xs text-gray-500">Today Orders</p></div>
          <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-2xl font-bold text-primary-500">KES {stats.revenue.toFixed(0)}</p><p className="text-xs text-gray-500">Revenue</p></div>
          <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-2xl font-bold">{stats.riders}</p><p className="text-xs text-gray-500">Active Riders</p></div>
          <div className="bg-white rounded-xl p-4 shadow-sm"><p className="text-2xl font-bold">{stats.restaurants}</p><p className="text-xs text-gray-500">Restaurants</p></div>
        </div>

        {(stats.pendingRiders > 0 || stats.pendingRestaurants > 0 || stats.pendingDisbursements > 0 || stats.pendingPromotions > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2"><AlertTriangle size={18} /> Pending Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {stats.pendingRiders > 0 && <Link to="/admin/riders" className="text-yellow-700">🚨 {stats.pendingRiders} rider approvals</Link>}
              {stats.pendingRestaurants > 0 && <Link to="/admin/restaurants" className="text-yellow-700">🍽️ {stats.pendingRestaurants} restaurant approvals</Link>}
              {stats.pendingDisbursements > 0 && <Link to="/admin/disbursements" className="text-yellow-700">💰 {stats.pendingDisbursements} disbursement batches</Link>}
              {stats.pendingPromotions > 0 && <Link to="/admin/promotions" className="text-yellow-700">🎉 {stats.pendingPromotions} promotions</Link>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { to: '/admin/orders', icon: ClipboardList, label: 'Orders', color: 'bg-blue-100 text-blue-600' },
            { to: '/admin/users', icon: Users, label: 'Users', color: 'bg-purple-100 text-purple-600' },
            { to: '/admin/restaurants', icon: Store, label: 'Restaurants', color: 'bg-orange-100 text-orange-600' },
            { to: '/admin/riders', icon: Bike, label: 'Riders', color: 'bg-green-100 text-green-600' },
            { to: '/admin/disbursements', icon: DollarSign, label: 'Disburse', color: 'bg-yellow-100 text-yellow-600' },
            { to: '/admin/promotions', icon: Bell, label: 'Promotions', color: 'bg-pink-100 text-pink-600' },
            { to: '/admin/settings', icon: Settings, label: 'Settings', color: 'bg-gray-100 text-gray-600' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to} className={`rounded-xl p-4 flex flex-col items-center gap-2 ${color}`}>
              <Icon size={24} /><span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-4xl mx-auto flex justify-around py-2 overflow-x-auto">
          {[
            { to: '/admin/dashboard', label: 'Home' },
            { to: '/admin/orders', label: 'Orders' },
            { to: '/admin/restaurants', label: 'Restaurants' },
            { to: '/admin/riders', label: 'Riders' },
            { to: '/admin/disbursements', label: 'Disburse' },
            { to: '/admin/settings', label: 'Settings' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="text-xs text-gray-400 px-2 py-1 whitespace-nowrap">{label}</Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
