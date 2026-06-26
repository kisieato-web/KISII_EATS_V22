import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Phone, User, Lock, ArrowRight, CheckCircle, Loader } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [resendDisabled, setResendDisabled] = useState(true);
  const { signUpWithOTP, verifySignUpOTP } = useAuth();
  const navigate = useNavigate();

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async () => {
    setError('');
    if (!name.trim()) { setError('Enter your full name'); return; }
    if (!phone || phone.length < 9) { setError('Enter a valid phone number'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    localStorage.setItem('signup_password', password);
    const { error: err } = await signUpWithOTP(phone, name.trim());
    setLoading(false);

    if (err) {
      setError(err.message);
      setStatusMessage('');
    } else {
      setStep('otp');
      setTimeLeft(300);
      setResendCountdown(30);
      setResendDisabled(true);
      setStatusMessage('Verification code sent.');
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code'); return; }

    setLoading(true);
    const savedPassword = localStorage.getItem('signup_password') || 'kisii_eats_2026_secure';
    const { error: err } = await verifySignUpOTP(phone, otp, savedPassword);
    setLoading(false);

    if (err) { setError(err.message); }
    else {
      localStorage.removeItem('signup_password');
      navigate('/dashboard');
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    const { error: err } = await signUpWithOTP(phone, name.trim());
    setLoading(false);

    if (err) {
      setError(err.message);
      setStatusMessage('');
      return;
    }

    setResendDisabled(true);
    setResendCountdown(30);
    setTimeLeft(300);
    setOtp('');
    setStatusMessage('A new code has been sent.');
  };

  useEffect(() => {
    if (step !== 'otp') return;

    const timerId = setInterval(() => {
      setTimeLeft((seconds) => Math.max(seconds - 1, 0));
      setResendCountdown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [step]);

  useEffect(() => {
    if (resendCountdown === 0) setResendDisabled(false);
  }, [resendCountdown]);

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
          {step === 'details' ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative mb-4">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Mwangi"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none text-lg"
                />
              </div>

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
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none text-lg"
                />
              </div>

              {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}

              <button
                onClick={handleSendOTP}
                disabled={loading || !name || phone.length < 9 || password.length < 6}
                className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Code'} <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Enter the 6-digit code sent to <strong>{phone}</strong></p>
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none text-center text-2xl tracking-[0.5em] font-mono mb-4"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
              />

              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>Expires in {formatTimer(timeLeft)}</span>
                <button
                  onClick={handleResendOTP}
                  disabled={resendDisabled || loading}
                  className="text-primary-500 font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend code'}
                </button>
              </div>

              {statusMessage && <p className="text-green-600 text-sm mb-3 bg-green-50 p-2 rounded-lg">{statusMessage}</p>}
              {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Create Account'}
              </button>
              <button onClick={() => setStep('details')} className="w-full text-center text-sm text-gray-500 mt-3">Change details</button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary-500 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
