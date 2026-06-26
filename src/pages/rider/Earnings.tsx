import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, DollarSign, TrendingUp } from 'lucide-react';

export default function RiderEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ deliveries: 0, fees: 0, commission: 0, payout: 0 });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('weekly_rider_audits').select('*').eq('rider_id', user.id).order('week_start', { ascending: false }).limit(12)
      .then(({ data }) => {
        if (data) {
          setAudits(data);
          setTotals({
            deliveries: data.reduce((s, a) => s + a.total_deliveries, 0),
            fees: data.reduce((s, a) => s + a.total_delivery_fees, 0),
            commission: data.reduce((s, a) => s + a.total_commission_deducted, 0),
            payout: data.reduce((s, a) => s + a.total_payout, 0),
          });
        }
        setLoading(false);
      });
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/rider/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Earnings</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <DollarSign size={20} className="text-green-500 mb-2" />
            <p className="text-xs text-gray-500">Total Payout</p>
            <p className="text-xl font-bold text-primary-500">KES {totals.payout.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <TrendingUp size={20} className="text-blue-500 mb-2" />
            <p className="text-xs text-gray-500">Deliveries</p>
            <p className="text-xl font-bold text-gray-900">{totals.deliveries}</p>
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-3">Weekly Breakdown</h3>
        <div className="space-y-2">
          {audits.map(a => (
            <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{new Date(a.week_start).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} - {new Date(a.week_end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</p>
                <p className="text-xs text-gray-500">{a.total_deliveries} deliveries</p>
              </div>
              <p className="font-semibold text-primary-500">KES {a.total_payout.toFixed(0)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
