import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, DollarSign, TrendingUp } from 'lucide-react';

export default function RestaurantEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ orders: 0, revenue: 0, commission: 0, payout: 0 });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('restaurants').select('id').eq('owner_id', user.id).single().then(({ data }) => {
      if (!data) { navigate('/restaurant/profile'); return; }
      supabase.from('daily_restaurant_audits').select('*').eq('restaurant_id', data.id).order('audit_date', { ascending: false }).limit(30)
        .then(({ data: auditsData }) => {
          if (auditsData) {
            setAudits(auditsData);
            setTotals({
              orders: auditsData.reduce((s, a) => s + a.total_orders, 0),
              revenue: auditsData.reduce((s, a) => s + a.total_base_subtotal, 0),
              commission: auditsData.reduce((s, a) => s + a.total_commission_deducted, 0),
              payout: auditsData.reduce((s, a) => s + a.total_payout, 0),
            });
          }
          setLoading(false);
        });
    });
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/restaurant/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Earnings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <DollarSign size={20} className="text-green-500 mb-2" />
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">KES {totals.revenue.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <TrendingUp size={20} className="text-primary-500 mb-2" />
            <p className="text-xs text-gray-500">Total Payout</p>
            <p className="text-xl font-bold text-primary-500">KES {totals.payout.toFixed(0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between text-sm mb-2"><span>Commission Deducted</span><span className="text-red-500">- KES {totals.commission.toFixed(0)}</span></div>
          <div className="flex justify-between text-sm mb-2"><span>Total Orders</span><span>{totals.orders}</span></div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-3">Daily Breakdown</h3>
        <div className="space-y-2">
          {audits.map(a => (
            <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{new Date(a.audit_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                <p className="text-xs text-gray-500">{a.total_orders} orders</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary-500">KES {a.total_payout.toFixed(0)}</p>
                <p className="text-xs text-gray-400">Revenue: KES {a.total_base_subtotal.toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
