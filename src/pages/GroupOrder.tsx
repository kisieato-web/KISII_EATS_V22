import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Users, Clock3 } from 'lucide-react';

export default function GroupOrder() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    supabase.from('group_orders').select('*').eq('invite_code', code).single().then(({ data }) => {
      setGroup(data);
      setLoading(false);
    });
  }, [code]);

  const statusLabel = useMemo(() => {
    if (!group) return 'Pending';
    return new Date(group.lock_at) > new Date() ? 'Open' : 'Locked';
  }, [group]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="font-display font-bold text-xl">Group Order</h1>
            <p className="text-sm text-gray-500">Invite code: {code}</p>
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">Restaurant #{group?.restaurant_id?.slice(0, 8)}</p>
              <p className="text-sm text-gray-500">Share this link to invite friends</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-secondary-100 text-secondary-700 text-xs font-semibold">{statusLabel}</span>
          </div>
          <div className="rounded-xl bg-secondary-50 p-4 text-sm text-secondary-700 flex items-center gap-2">
            <Users size={16} /> Group ordering lets everyone add items and split a shared delivery fee.
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Clock3 size={16} /> Lock time: {group?.lock_at ? new Date(group.lock_at).toLocaleString() : 'Soon'}
          </div>
          <button onClick={() => navigate('/dashboard')} className="mt-5 w-full bg-primary-500 text-white py-3 rounded-xl font-semibold">Back to Restaurants</button>
        </div>
      </div>
    </div>
  );
}
