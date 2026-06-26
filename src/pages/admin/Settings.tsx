import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any[]>([]);
  const [markupTiers, setMarkupTiers] = useState<any[]>([]);
  const [surgeRules, setSurgeRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role !== 'admin') { navigate('/dashboard'); return; }
      Promise.all([
        supabase.from('platform_settings').select('*').order('key'),
        supabase.from('markup_tiers').select('*').order('min_price'),
        supabase.from('surge_pricing_rules').select('*').order('start_time'),
      ]).then(([s, m, sr]) => {
        if (s.data) setSettings(s.data);
        if (m.data) setMarkupTiers(m.data);
        if (sr.data) setSurgeRules(sr.data);
        setLoading(false);
      });
    });
  }, [user]);

  const updateSetting = (key: string, value: string) => {
    setSettings(settings.map(s => s.key === key ? { ...s, value } : s));
  };

  const saveSettings = async () => {
    setSaving(true);
    for (const s of settings) {
      await supabase.from('platform_settings').upsert({ key: s.key, value: s.value, updated_by: user!.id, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setSaving(false);
  };

  const updateMarkupTier = (id: string, field: string, value: any) => {
    setMarkupTiers(markupTiers.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const saveMarkupTiers = async () => {
    for (const m of markupTiers) {
      await supabase.from('markup_tiers').upsert({ id: m.id, min_price: m.min_price, max_price: m.max_price, markup_percentage: m.markup_percentage, is_active: m.is_active });
    }
  };

  const updateSurgeRule = (id: string, field: string, value: any) => {
    setSurgeRules(surgeRules.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const saveSurgeRules = async () => {
    for (const s of surgeRules) {
      await supabase.from('surge_pricing_rules').upsert({ id: s.id, name: s.name, start_time: s.start_time, end_time: s.end_time, delivery_multiplier: s.delivery_multiplier, markup_multiplier: s.markup_multiplier, is_active: s.is_active });
    }
  };

  if (loading) return <LoadingSpinner />;

  const coreSettings = settings.filter(s => ['markup_percentage', 'default_restaurant_commission', 'rider_commission_percentage', 'delivery_fee_per_km', 'min_delivery_fee', 'cancellation_refund_percentage', 'loyalty_points_per_order', 'referral_bonus_points', 'group_min_members', 'group_max_members', 'group_delivery_discount_3', 'group_delivery_discount_4', 'group_delivery_discount_5'].includes(s.key));
  const smartpaySettings = settings.filter(s => s.key.startsWith('smartpay'));
  const smsSettings = settings.filter(s => s.key.startsWith('sms'));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Platform Settings</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Core Settings</h3>
          {coreSettings.map(s => (
            <div key={s.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{s.key.replace(/_/g, ' ')}</span>
              <input value={s.value} onChange={(e) => updateSetting(s.key, e.target.value)} className="w-24 text-right px-2 py-1 rounded border text-sm" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Markup Tiers</h3>
          {markupTiers.map(m => (
            <div key={m.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 text-sm">
              <input type="number" value={m.min_price} onChange={(e) => updateMarkupTier(m.id, 'min_price', parseFloat(e.target.value))} className="w-20 px-2 py-1 rounded border" placeholder="Min" />
              <span>to</span>
              <input type="number" value={m.max_price || ''} onChange={(e) => updateMarkupTier(m.id, 'max_price', e.target.value ? parseFloat(e.target.value) : null)} className="w-20 px-2 py-1 rounded border" placeholder="Max" />
              <input type="number" value={m.markup_percentage} onChange={(e) => updateMarkupTier(m.id, 'markup_percentage', parseFloat(e.target.value))} className="w-16 px-2 py-1 rounded border" />%
              <button onClick={() => updateMarkupTier(m.id, 'is_active', !m.is_active)} className={`text-xs px-2 py-0.5 rounded ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.is_active ? 'On' : 'Off'}</button>
            </div>
          ))}
          <button onClick={saveMarkupTiers} className="mt-3 text-xs bg-primary-500 text-white px-3 py-1 rounded flex items-center gap-1"><Save size={12} /> Save Tiers</button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Surge Pricing</h3>
          {surgeRules.map(s => (
            <div key={s.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 text-sm">
              <input value={s.name} onChange={(e) => updateSurgeRule(s.id, 'name', e.target.value)} className="w-24 px-2 py-1 rounded border" />
              <input type="time" value={s.start_time || ''} onChange={(e) => updateSurgeRule(s.id, 'start_time', e.target.value)} className="px-2 py-1 rounded border" />
              <input type="time" value={s.end_time || ''} onChange={(e) => updateSurgeRule(s.id, 'end_time', e.target.value)} className="px-2 py-1 rounded border" />
              <input type="number" step="0.1" value={s.delivery_multiplier} onChange={(e) => updateSurgeRule(s.id, 'delivery_multiplier', parseFloat(e.target.value))} className="w-14 px-2 py-1 rounded border" />x
              <button onClick={() => updateSurgeRule(s.id, 'is_active', !s.is_active)} className={`text-xs px-2 py-0.5 rounded ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.is_active ? 'On' : 'Off'}</button>
            </div>
          ))}
          <button onClick={saveSurgeRules} className="mt-3 text-xs bg-primary-500 text-white px-3 py-1 rounded flex items-center gap-1"><Save size={12} /> Save Rules</button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">SmartPay & SMS</h3>
          {[...smartpaySettings, ...smsSettings].map(s => (
            <div key={s.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{s.key.replace(/_/g, ' ')}</span>
              <input value={s.value} onChange={(e) => updateSetting(s.key, e.target.value)} className="w-32 text-right px-2 py-1 rounded border text-sm" type={s.key.includes('api_key') || s.key.includes('secret') ? 'password' : 'text'} />
            </div>
          ))}
        </div>

        <button onClick={saveSettings} disabled={saving} className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><Save size={18} /> {saving ? 'Saving...' : 'Save All Settings'}</button>
      </div>
    </div>
  );
}
