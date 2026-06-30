import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { sendSMS } from '../../lib/smartpay';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Check, X } from 'lucide-react';

export default function AdminRestaurants() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role !== 'admin') { navigate('/dashboard'); return; }
      loadRestaurants();
    });
  }, [user]);

  const loadRestaurants = async () => {
    const { data } = await supabase.from('restaurants').select('*, owner:users(full_name, phone)').order('created_at', { ascending: false });
    if (data) setRestaurants(data);
    setLoading(false);
  };

  const approve = async (id: string) => {
    await supabase.from('restaurants').update({ status: 'active', approved_at: new Date().toISOString() }).eq('id', id);
    const restaurant = restaurants.find(r => r.id === id);
    if (restaurant?.owner?.phone) {
      try {
        await sendSMS(
          restaurant.owner.phone,
          `Your restaurant "${restaurant.name}" has been approved on Kisii Eats! Log in to set up your menu and start receiving orders.`
        );
      } catch { /* SMS failure should not block approval */ }
    }
    loadRestaurants();
  };

  const reject = async (id: string) => {
    await supabase.from('restaurants').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', id);
    const restaurant = restaurants.find(r => r.id === id);
    if (restaurant?.owner?.phone) {
      try {
        await sendSMS(
          restaurant.owner.phone,
          `Your Kisii Eats restaurant application was not approved${rejectReason ? `: ${rejectReason}` : ''}. Contact us for more info.`
        );
      } catch { /* SMS failure should not block rejection */ }
    }
    setRejectReason('');
    setSelectedId('');
    loadRestaurants();
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'suspended' : 'active';
    await supabase.from('restaurants').update({ status: newStatus }).eq('id', id);
    loadRestaurants();
  };

  const filtered = restaurants.filter(r => filter === 'all' || r.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Restaurants</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {['all', 'pending', 'active', 'suspended', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs ${filter === s ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">Owner: {r.owner?.full_name} | {r.phone}</p>
                  <p className="text-xs text-gray-500">Commission: {r.commission_percentage}% | Own Rider: {r.use_own_rider ? 'Yes' : 'No'}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'active' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(r.id)} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1"><Check size={14} /> Approve</button>
                  {selectedId === r.id ? (
                    <div className="flex-1 flex gap-1">
                      <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..." className="flex-1 px-2 py-2 rounded-lg border text-xs" />
                      <button onClick={() => reject(r.id)} className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs"><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setSelectedId(r.id)} className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg text-sm">Reject</button>
                  )}
                </div>
              )}
              {r.status !== 'pending' && (
                <button onClick={() => toggleStatus(r.id, r.status)} className="mt-3 text-xs text-gray-500 underline">
                  {r.status === 'active' ? 'Suspend' : 'Reactivate'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
