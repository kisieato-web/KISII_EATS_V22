import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Save, Bike } from 'lucide-react';

export default function RiderProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id_number: '', vehicle_type: '', vehicle_plate: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('rider_profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) { setProfile(data); setForm({ id_number: data.id_number || '', vehicle_type: data.vehicle_type || '', vehicle_plate: data.vehicle_plate || '' }); }
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    setSaving(true);
    if (profile) {
      await supabase.from('rider_profiles').update(form).eq('id', profile.id);
    } else {
      await supabase.from('rider_profiles').insert({ user_id: user!.id, ...form, status: 'pending' });
    }
    setSaving(false);
    navigate('/rider/dashboard');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/rider/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Rider Profile</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <Bike size={32} className="text-blue-600" />
          </div>
          {profile?.status === 'pending' && <p className="text-center text-yellow-600 text-sm mb-4">Pending admin approval</p>}
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
          <input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
          <input value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} placeholder="e.g. Motorcycle, Boda Boda" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Plate (optional)</label>
          <input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />
          <button onClick={save} disabled={saving} className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
            <Save size={18} /> {profile ? 'Update' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
