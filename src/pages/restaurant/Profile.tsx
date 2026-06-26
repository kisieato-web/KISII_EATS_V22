import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Save, Store } from 'lucide-react';

export default function RestaurantProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', phone: '', address: '', commission_percentage: 5, use_own_rider: false, own_rider_name: '', own_rider_phone: '', opening_time: '', closing_time: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('restaurants').select('*').eq('owner_id', user.id).single().then(({ data }) => {
      if (data) {
        setRestaurant(data);
        setForm({ name: data.name || '', description: data.description || '', phone: data.phone || '', address: data.address || '', commission_percentage: data.commission_percentage || 5, use_own_rider: data.use_own_rider || false, own_rider_name: data.own_rider_name || '', own_rider_phone: data.own_rider_phone || '', opening_time: data.opening_time || '', closing_time: data.closing_time || '' });
      }
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    setSaving(true);
    if (restaurant) {
      await supabase.from('restaurants').update(form).eq('id', restaurant.id);
    } else {
      const { data } = await supabase.from('restaurants').insert({ owner_id: user!.id, ...form, status: 'pending' }).select('id').single();
      if (data) setRestaurant({ id: data.id, ...form });
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/restaurant/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Restaurant Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <Store size={32} className="text-primary-500" />
          </div>
          {restaurant?.status === 'pending' && (
            <p className="text-center text-yellow-600 text-sm mb-4">Your restaurant is pending admin approval</p>
          )}
          {restaurant?.status === 'rejected' && (
            <p className="text-center text-red-500 text-sm mb-4">Rejected: {restaurant.rejection_reason}</p>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />

          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />

          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />

          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />

          <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
          <input value={form.opening_time} onChange={(e) => setForm({ ...form, opening_time: e.target.value })} type="time" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />

          <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
          <input value={form.closing_time} onChange={(e) => setForm({ ...form, closing_time: e.target.value })} type="time" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />

          <label className="block text-sm font-medium text-gray-700 mb-1">Commission % (min 5%)</label>
          <input value={form.commission_percentage} onChange={(e) => setForm({ ...form, commission_percentage: parseFloat(e.target.value) || 5 })} type="number" min="5" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />

          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={form.use_own_rider} onChange={(e) => setForm({ ...form, use_own_rider: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm text-gray-700">I have my own delivery rider</span>
          </label>

          {form.use_own_rider && (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rider Name</label>
              <input value={form.own_rider_name} onChange={(e) => setForm({ ...form, own_rider_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Rider Phone</label>
              <input value={form.own_rider_phone} onChange={(e) => setForm({ ...form, own_rider_phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />
            </>
          )}

          <button onClick={save} disabled={saving} className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
            <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
