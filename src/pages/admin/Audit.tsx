import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft } from 'lucide-react';

export default function AdminAudit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('users').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role !== 'admin') { navigate('/dashboard'); return; }
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => { if (data) setLogs(data); setLoading(false); });
    });
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="font-display font-bold text-xl text-gray-900">Audit Logs</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-gray-900">{log.action}</p>
              <p className="text-sm text-gray-500">{log.details}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
