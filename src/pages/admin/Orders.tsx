import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { ArrowLeft, Search } from 'lucide-react';

export default function AdminOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role !== 'admin') { navigate('/dashboard'); return; }
      loadData();
    });
  }, [user]);

  const loadData = async () => {
    const [{ data: o }, { data: r }] = await Promise.all([
      supabase.from('orders').select('*, restaurant:restaurants(name), customer:users!orders_customer_id_fkey(full_name, phone), rider:users!orders_rider_id_fkey(full_name, phone)').order('created_at', { ascending: false }).limit(100),
      supabase.from('rider_profiles').select('user_id, users(full_name)').eq('status', 'approved'),
    ]);
    if (o) setOrders(o);
    if (r) setRiders(r);
    setLoading(false);
  };

  const assignRider = async (orderId: string, riderId: string) => {
    await supabase.from('orders').update({ rider_id: riderId }).eq('id', orderId);
    loadData();
    setSelectedOrder(null);
  };

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.id.includes(search) && !o.restaurant?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Order Management</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ID or restaurant..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {['all', 'pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${filter === s ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border'}`}>{s === 'all' ? 'All' : s.replace('_', ' ')}</button>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3">Order</th>
                  <th className="text-left px-4 py-3">Restaurant</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Rider</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-center px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{o.restaurant?.name}</td>
                    <td className="px-4 py-3">{o.customer?.full_name}</td>
                    <td className="px-4 py-3">{o.rider?.full_name || '—'}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right font-medium">KES {o.total_amount?.toFixed(0)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedOrder(o)} className="text-primary-500 text-xs font-medium">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="font-display font-bold text-lg mb-4">Order #{selectedOrder.id.slice(0, 8)}</h2>
              <div className="space-y-2 text-sm mb-4">
                <p><strong>Restaurant:</strong> {selectedOrder.restaurant?.name}</p>
                <p><strong>Customer:</strong> {selectedOrder.customer?.full_name} ({selectedOrder.customer?.phone})</p>
                <p><strong>Status:</strong> <OrderStatusBadge status={selectedOrder.status} /></p>
                <p><strong>Payment:</strong> {selectedOrder.payment_option}% upfront | {selectedOrder.payment_status}</p>
                <p><strong>Total:</strong> KES {selectedOrder.total_amount?.toFixed(0)}</p>
                <p><strong>Markup:</strong> KES {selectedOrder.markup_amount?.toFixed(0)}</p>
                <p><strong>Restaurant Payout:</strong> KES {selectedOrder.restaurant_payout?.toFixed(0)}</p>
                <p><strong>Rider Payout:</strong> KES {selectedOrder.rider_payout?.toFixed(0)}</p>
                <p><strong>Platform Revenue:</strong> KES {selectedOrder.platform_revenue?.toFixed(0)}</p>
                <p><strong>Triple Confirm:</strong> 🍽️{selectedOrder.restaurant_confirmed_dispatch ? '✅' : '❌'} 🏍️{selectedOrder.rider_confirmed_pickup ? '✅' : '❌'} 📦{selectedOrder.customer_confirmed_delivery ? '✅' : '❌'}</p>
              </div>
              {!selectedOrder.rider_id && selectedOrder.status === 'ready' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Assign Rider</label>
                  <select onChange={(e) => assignRider(selectedOrder.id, e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200">
                    <option value="">Select rider...</option>
                    {riders.map((r: any) => (
                      <option key={r.user_id} value={r.user_id}>{r.users?.full_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={() => setSelectedOrder(null)} className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
