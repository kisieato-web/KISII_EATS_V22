import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Plus } from 'lucide-react';

export default function RestaurantPromotions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurantId, setRestaurantId] = useState('');
  const [promotions, setPromotions] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', menu_item_id: '', discount_percentage: '', starts_at: '', ends_at: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('restaurants').select('id').eq('owner_id', user.id).single().then(({ data }) => {
      if (!data) return;
      setRestaurantId(data.id);
      Promise.all([
        supabase.from('promotions').select('*').eq('restaurant_id', data.id).order('created_at', { ascending: false }),
        supabase.from('menu_items').select('id, name').eq('restaurant_id', data.id),
      ]).then(([p, m]) => { if (p.data) setPromotions(p.data); if (m.data) setMenuItems(m.data); setLoading(false); });
    });
  }, [user]);

  const handleSubmit = async () => {
    await supabase.from('promotions').insert({ restaurant_id: restaurantId, title: form.title, description: form.description, menu_item_id: form.menu_item_id || null, discount_percentage: parseFloat(form.discount_percentage), starts_at: form.starts_at, ends_at: form.ends_at, status: 'pending' });
    setShowForm(false);
    setForm({ title: '', description: '', menu_item_id: '', discount_percentage: '', starts_at: '', ends_at: '' });
    const { data } = await supabase.from('promotions').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
    if (data) setPromotions(data);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4"><div className="max-w-lg mx-auto flex items-center justify-between"><div className="flex items-center gap-3"><Link to="/restaurant/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link><h1 className="font-display font-bold text-xl">Promotions</h1></div><button onClick={() => setShowForm(true)} className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><Plus size={16} /> New</button></div></div>
      <div className="max-w-lg mx-auto px-4 pt-4">
        {showForm && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Promotion title" className="w-full px-3 py-2 rounded-lg border mb-2" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 rounded-lg border mb-2" />
            <select value={form.menu_item_id} onChange={(e) => setForm({ ...form, menu_item_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border mb-2"><option value="">All items</option>{menuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}</select>
            <input value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })} type="number" placeholder="Discount %" className="w-full px-3 py-2 rounded-lg border mb-2" />
            <input value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} type="date" className="w-full px-3 py-2 rounded-lg border mb-2" />
            <input value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} type="date" className="w-full px-3 py-2 rounded-lg border mb-3" />
            <div className="flex gap-2"><button onClick={handleSubmit} className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm">Submit for Approval</button><button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm">Cancel</button></div>
          </div>
        )}
        <div className="space-y-3">
          {promotions.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2"><p className="font-semibold">{p.title}</p><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span></div>
              <p className="text-sm text-gray-500">{p.discount_percentage}% off</p>
              <p className="text-xs text-gray-400">{new Date(p.starts_at).toLocaleDateString()} → {new Date(p.ends_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
