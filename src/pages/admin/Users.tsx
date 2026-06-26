import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Search } from 'lucide-react';

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role !== 'admin') { navigate('/dashboard'); return; }
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(200).then(({ data: u }) => { if (u) setUsers(u); setLoading(false); });
    });
  }, [user]);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('users').update({ is_active: !current }).eq('id', id);
    setUsers(users.map(u => u.id === id ? { ...u, is_active: !current } : u));
  };

  const filtered = users.filter(u => search ? u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase()) : true);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">User Management</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white" />
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Tier</th>
                <th className="text-right px-4 py-3">Wallet</th>
                <th className="text-right px-4 py-3">Points</th>
                <th className="text-center px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-xs">{u.phone}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{u.role}</span></td>
                  <td className="px-4 py-3 capitalize text-xs">{u.loyalty_tier}</td>
                  <td className="px-4 py-3 text-right">KES {u.wallet_balance?.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right">{u.loyalty_points}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(u.id, u.is_active)} className={`text-xs px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
