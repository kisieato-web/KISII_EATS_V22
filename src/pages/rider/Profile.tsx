import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Save, Bike, Upload, Camera } from 'lucide-react';

export default function RiderProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'id' | 'body' | null>(null);
  const [form, setForm] = useState({ id_number: '', vehicle_type: 'motorcycle', vehicle_plate: '' });
  const idFileRef = useRef<HTMLInputElement>(null);
  const bodyFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('rider_profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) { setProfile(data); setForm({ id_number: data.id_number || '', vehicle_type: data.vehicle_type || 'motorcycle', vehicle_plate: data.vehicle_plate || '' }); }
      setLoading(false);
    });
  }, [user]);

  const uploadFile = async (file: File, field: string) => {
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    await supabase.storage.from('rider-photos').upload(path, file);
    const { data: { publicUrl } } = supabase.storage.from('rider-photos').getPublicUrl(path);
    await supabase.from('rider_profiles').update({ [field]: publicUrl }).eq('user_id', user!.id);
    return publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'body') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    try {
      const field = type === 'id' ? 'id_document_url' : 'full_body_photo_url';
      await uploadFile(file, field);
      const { data } = await supabase.from('rider_profiles').select('*').eq('user_id', user!.id).single();
      if (data) setProfile(data);
    } catch (err: any) { alert('Upload failed: ' + err.message); }
    setUploading(null);
  };

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
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
          <input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Document Photo</label>
          <input type="file" ref={idFileRef} onChange={(e) => handleFileSelect(e, 'id')} accept="image/*" className="hidden" />
          <button onClick={() => idFileRef.current?.click()} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-4 mb-3 text-gray-500">{uploading === 'id' ? 'Uploading...' : profile?.id_document_url ? '✅ Uploaded (tap to change)' : <><Upload size={16} /> Upload ID Photo</>}</button>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Body Photo (no glasses)</label>
          <input type="file" ref={bodyFileRef} onChange={(e) => handleFileSelect(e, 'body')} accept="image/*" className="hidden" />
          <button onClick={() => bodyFileRef.current?.click()} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-4 mb-3 text-gray-500">{uploading === 'body' ? 'Uploading...' : profile?.full_body_photo_url ? '✅ Uploaded (tap to change)' : <><Camera size={16} /> Upload Body Photo</>}</button>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
          <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3"><option value="motorcycle">Motorcycle</option><option value="boda_boda">Boda Boda</option><option value="car">Car</option><option value="bicycle">Bicycle</option></select>
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
