import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { User, Wallet, Star, LogOut, ChevronRight } from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return <p className="text-center py-20">Profile not found</p>;

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar title="Profile" />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={36} className="text-primary-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-gray-900">{profile.full_name}</h2>
          <p className="text-gray-500 text-sm">{profile.phone}</p>
          <p className="text-gray-500 text-sm">{profile.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <Wallet size={24} className="text-green-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Wallet Balance</p>
            <p className="font-bold text-lg text-gray-900">KES {profile.wallet_balance?.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <Star size={24} className="text-yellow-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loyalty Points</p>
            <p className="font-bold text-lg text-gray-900">{profile.loyalty_points}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Loyalty Tier</p>
            <p className="font-semibold text-gray-900 capitalize">{profile.loyalty_tier}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            profile.loyalty_tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
            profile.loyalty_tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
            profile.loyalty_tier === 'silver' ? 'bg-gray-100 text-gray-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {profile.loyalty_tier?.toUpperCase()}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <button className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-gray-700">Edit Profile</span><ChevronRight size={18} className="text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-gray-700">Payment Methods</span><ChevronRight size={18} className="text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3">
            <span className="text-gray-700">Referral Code</span>
            <span className="text-sm text-primary-500 font-medium">{(profile as any).referral_code || 'N/A'}</span>
          </button>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 bg-white rounded-2xl shadow-sm border border-gray-100">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
