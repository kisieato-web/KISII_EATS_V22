import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { sendSMS } from '../../lib/smartpay';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Check, X } from 'lucide-react';

export default function AdminRiders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role !== 'admin') { navigate('/dashboard'); return; }
      loadRiders();
    });
  }, [user]);

  const loadRiders = async () => {
    const { data } = await supabase.from('rider_profiles').select('*, user:users(full_name, phone, is_active)').order('created_at', { ascending: false });
    if (data) setRiders(data);
    setLoading(false);
  };

  const approve = async (id: string) => {
    await supabase.from('rider_profiles').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user!.id }).eq('id', id);
    // Notify rider by SMS
    const rider = riders.find(r => r.id === id);
    if (rider?.user?.phone) {
      try {
        await sendSMS(
          rider.user.phone,
          `Congratulations! Your Kisii Eats rider application has been approved. You can now log in and start accepting deliveries.`
        );
      } catch {
        // SMS failure should not block approval
      }
    }
    loadRiders();
  };

  const reject = async (id: string) => {
    await supabase.from('rider_profiles').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', id);
    // Notify rider by SMS
    const rider = riders.find(r => r.id === id);
    if (rider?.user?.phone) {
      try {
        await sendSMS(
          rider.user.phone,
          `Your Kisii Eats rider application was not approved${rejectReason ? `: ${rejectReason}` : ''}. Contact us for more info.`
        );
      } catch {
        // SMS failure should not block rejection
      }
    }
    setRejectReason('');
    setSelectedId('');
    loadRiders();
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'approved' ? 'suspended' : 'approved';
    await supabase.from('rider_profiles').update({ status: newStatus }).eq('id', id);
    loadRiders();
  };

  const filtered = riders.filter(r => filter === 'all' || r.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Rider Management</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {['all', 'pending', 'approved', 'suspended', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs ${filter === s ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{r.user?.full_name}</p>
                  <p className="text-xs text-gray-500">Phone: {r.user?.phone} | ID: {r.id_number}</p>
                  <p className="text-xs text-gray-500">Vehicle: {r.vehicle_type} {r.vehicle_plate ? `(${r.vehicle_plate})` : ''}</p>
                  <p className="text-xs text-gray-500">Deliveries: {r.total_deliveries} | Rating: {r.average_rating?.toFixed(1)} | Online: {r.is_online ? 'Yes' : 'No'}</p>
                  <div className="flex gap-2 mt-1">
                    {r.id_document_url && <a href={r.id_document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline">📄 ID Photo</a>}
                    {r.full_body_photo_url && <a href={r.full_body_photo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline">📸 Body Photo</a>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
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
                  {r.status === 'approved' ? 'Suspend' : 'Reactivate'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
