import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Phone, Lock, ArrowRight, Loader } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, formatPhone } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    if (!phone || phone.length < 9) { setError('Enter your phone number'); return; }
    if (!password) { setError('Enter your password'); return; }

    setLoading(true);
    const { error: err } = await signIn(phone, password);
    setLoading(false);

    if (err) { setError(err.message); return; }

    const formatted = formatPhone(phone);
    const { data: userData } = await supabase.from('users').select('role').eq('phone', formatted).single();

    switch (userData?.role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'restaurant_admin':
        navigate('/restaurant/dashboard');
        break;
      case 'rider':
        navigate('/rider/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-warm-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">KE</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to Kisii Eats</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <div className="relative mb-4">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712 345 678"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none text-lg"
            />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative mb-4">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : 'Sign In'} <ArrowRight size={18} />
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link to="/signup" className="text-primary-500 font-medium">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
