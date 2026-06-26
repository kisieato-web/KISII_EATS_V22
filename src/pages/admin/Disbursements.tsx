import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, DollarSign } from 'lucide-react';

export default function AdminDisbursements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchItems, setBatchItems] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role !== 'admin') { navigate('/dashboard'); return; }
      loadData();
    });
  }, [user]);

  const loadData = async () => {
    const [{ data: b }, { data: o }] = await Promise.all([
      supabase.from('disbursement_batches').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('orders').select('id, restaurant:restaurants(name), restaurant_payout, rider_payout, rider:users(full_name)').eq('is_disbursed', false).eq('status', 'delivered'),
    ]);
    if (b) setBatches(b);
    if (o) setPendingOrders(o);
    setLoading(false);
  };

  const viewBatch = async (batchId: string) => {
    const { data } = await supabase.from('disbursement_batch_items').select('*, recipient:users(full_name, phone)').eq('batch_id', batchId);
    if (data) setBatchItems(data);
    setSelectedBatch(batchId);
  };

  const createBatch = async () => {
    const totalRestaurant = pendingOrders.reduce((s, o) => s + (o.restaurant_payout || 0), 0);
    const totalRider = pendingOrders.reduce((s, o) => s + (o.rider_payout || 0), 0);
    const restaurantIds = [...new Set(pendingOrders.map(o => o.restaurant?.name))];
    const riderIds = [...new Set(pendingOrders.filter(o => o.rider_payout > 0).map(o => o.rider?.full_name))];

    const { data: batch } = await supabase.from('disbursement_batches').insert({
      status: 'pending',
      total_restaurant_payouts: totalRestaurant,
      total_rider_payouts: totalRider,
      total_amount: totalRestaurant + totalRider,
      order_count: pendingOrders.length,
      restaurant_count: restaurantIds.length,
      rider_count: riderIds.length,
      created_by: user!.id,
    }).select('id').single();

    if (batch) {
      const items = pendingOrders.map(o => ([
        { batch_id: batch.id, order_id: o.id, recipient_id: o.restaurant?.owner_id || user!.id, recipient_type: 'restaurant', amount: o.restaurant_payout },
        ...(o.rider_payout > 0 ? [{ batch_id: batch.id, order_id: o.id, recipient_id: o.rider?.id || user!.id, recipient_type: 'rider', amount: o.rider_payout }] : []),
      ])).flat();
      await supabase.from('disbursement_batch_items').insert(items);
      await supabase.from('orders').update({ is_disbursed: true, disbursement_batch_id: batch.id, disbursed_at: new Date().toISOString() }).in('id', pendingOrders.map(o => o.id));
      loadData();
    }
  };

  const approveBatch = async (batchId: string) => {
    await supabase.from('disbursement_batches').update({ status: 'approved', approved_by: user!.id, approved_at: new Date().toISOString() }).eq('id', batchId);
    loadData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Disbursements</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        {pendingOrders.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{pendingOrders.length} orders ready for disbursement</h3>
              <button onClick={createBatch} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm">Create Batch</button>
            </div>
            <p className="text-sm text-gray-500">Total: KES {pendingOrders.reduce((s, o) => s + (o.restaurant_payout || 0) + (o.rider_payout || 0), 0).toFixed(0)}</p>
          </div>
        )}

        <div className="space-y-3">
          {batches.map(b => (
            <div key={b.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">Batch #{b.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{b.order_count} orders | {b.restaurant_count} restaurants | {b.rider_count} riders</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${b.status === 'approved' ? 'bg-green-100 text-green-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Restaurant: KES {b.total_restaurant_payouts?.toFixed(0)}</span>
                <span>Rider: KES {b.total_rider_payouts?.toFixed(0)}</span>
              </div>
              <p className="font-bold text-primary-500">Total: KES {b.total_amount?.toFixed(0)}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => viewBatch(b.id)} className="text-xs text-primary-500 underline">View Details</button>
                {b.status === 'pending' && (
                  <button onClick={() => approveBatch(b.id)} className="text-xs bg-green-500 text-white px-3 py-1 rounded-full">Approve</button>
                )}
              </div>
              {selectedBatch === b.id && batchItems.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  {batchItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs py-1">
                      <span>{item.recipient?.full_name} ({item.recipient_type})</span>
                      <span className="font-medium">KES {item.amount?.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
