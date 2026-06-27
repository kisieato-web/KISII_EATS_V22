import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, ArrowRight, Loader } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const redirectByRole = (role: string) => {
    if (role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else if (role === 'restaurant_admin') {
      window.location.href = '/restaurant/dashboard';
    } else if (role === 'rider') {
      window.location.href = '/rider/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email) { setError('Enter your email'); return; }
    if (!password) { setError('Enter your password'); return; }

    setLoading(true);

    try {
      const { error: signInError, role } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      redirectByRole(role || 'customer');
    } finally {
      setLoading(false);
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative mb-4">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none" />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative mb-4">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          </div>

          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}

          <button onClick={handleLogin} disabled={loading} className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
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
