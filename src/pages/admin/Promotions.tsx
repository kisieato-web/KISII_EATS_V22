import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Check, X } from 'lucide-react';

export default function AdminPromotions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role !== 'admin') { navigate('/dashboard'); return; }
      loadPromotions();
    });
  }, [user]);

  const loadPromotions = async () => {
    const { data } = await supabase.from('promotions').select('*, restaurant:restaurants(name)').order('created_at', { ascending: false });
    if (data) setPromotions(data);
    setLoading(false);
  };

  const approve = async (id: string) => {
    await supabase.from('promotions').update({ status: 'approved', approved_by: user!.id, approved_at: new Date().toISOString() }).eq('id', id);
    loadPromotions();
  };

  const reject = async (id: string, reason: string) => {
    await supabase.from('promotions').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    loadPromotions();
  };

  const filtered = promotions.filter(p => filter === 'all' || p.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Promotions</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {['pending', 'approved', 'rejected', 'expired', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs ${filter === s ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.restaurant?.name} | {p.discount_percentage}% off</p>
                  <p className="text-xs text-gray-500">{new Date(p.starts_at).toLocaleDateString()} → {new Date(p.ends_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
              </div>
              {p.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(p.id)} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1"><Check size={14} /> Approve</button>
                  <button onClick={() => { const reason = prompt('Rejection reason (optional):'); reject(p.id, reason || ''); }} className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg text-sm">Reject</button>
                </div>
              )}
              {p.rejection_reason && <p className="text-xs text-red-500 mt-2">Reason: {p.rejection_reason}</p>}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-gray-500 py-12">No promotions found</p>}
        </div>
      </div>
    </div>
  );
}
