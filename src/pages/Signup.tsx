import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (role: string) => {
    const normalizedRole = role || 'customer';
    if (normalizedRole === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (normalizedRole === 'restaurant_admin') {
      navigate('/restaurant/dashboard', { replace: true });
    } else if (normalizedRole === 'rider') {
      navigate('/rider/dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSignUp = async () => {
    setError('');
    if (!name.trim()) { setError('Enter your full name'); return; }
    if (!email) { setError('Enter your email'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);

    try {
      const { error: err, user, role, session } = await signUp(email, password, name.trim(), phone);

      if (err) {
        setError(err.message);
        return;
      }

      if (!user) {
        setError('Signup failed. Try again.');
        return;
      }

      if (!session) {
        const signInResult = await signIn(email, password);
        if (signInResult.error) {
          setError('Account created. Please sign in with your email and password.');
          return;
        }

        redirectByRole(signInResult.role || role || 'customer');
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
          <h1 className="font-display font-bold text-2xl text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join Kisii Eats</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <div className="relative mb-4">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Mwangi" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none" />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative mb-4">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none" />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">Phone (optional)</label>
          <div className="relative mb-4">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none" />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative mb-4">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleSignUp()} />
          </div>

          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}

          <button onClick={handleSignUp} disabled={loading} className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Account'} <ArrowRight size={18} />
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary-500 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
