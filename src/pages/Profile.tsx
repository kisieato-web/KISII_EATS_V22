import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { User, Wallet, Star, LogOut, ChevronRight, Save, X } from 'lucide-react';

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '');
      setEditPhone(profile.phone || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSave = async () => {
    if (!editName.trim()) { setSaveError('Name cannot be empty'); return; }
    setSaving(true);
    setSaveError('');
    const { error } = await supabase
      .from('users')
      .update({ full_name: editName.trim(), phone: editPhone.trim() })
      .eq('id', user!.id);
    setSaving(false);
    if (error) { setSaveError('Failed to save. Try again.'); return; }
    setEditing(false);
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      alert('Referral code copied!');
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (!profile) return <p className="text-center py-20 text-gray-500">Profile not found</p>;

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar title="Profile" />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">

        {/* Avatar & basic info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={36} className="text-primary-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-gray-900">{profile.full_name}</h2>
          <p className="text-gray-500 text-sm">{profile.phone || 'No phone added'}</p>
          <p className="text-gray-400 text-xs">{profile.email}</p>
        </div>

        {/* Wallet & loyalty */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <Wallet size={24} className="text-green-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Wallet Balance</p>
            <p className="font-bold text-lg text-gray-900">KES {(profile.wallet_balance || 0).toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <Star size={24} className="text-yellow-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loyalty Points</p>
            <p className="font-bold text-lg text-gray-900">{profile.loyalty_points || 0}</p>
          </div>
        </div>

        {/* Loyalty tier */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Loyalty Tier</p>
            <p className="font-semibold text-gray-900 capitalize">{profile.loyalty_tier || 'Bronze'}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            profile.loyalty_tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
            profile.loyalty_tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
            profile.loyalty_tier === 'silver' ? 'bg-gray-100 text-gray-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {(profile.loyalty_tier || 'BRONZE').toUpperCase()}
          </div>
        </div>

        {/* Referral code */}
        {profile.referral_code && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <p className="text-sm text-gray-500 mb-2">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 px-4 py-3 rounded-xl text-lg font-mono font-bold text-primary-500 text-center">
                {profile.referral_code}
              </code>
              <button
                onClick={copyReferralCode}
                className="bg-primary-500 text-white px-4 py-3 rounded-xl text-sm font-medium"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Share with friends — you both earn 50 loyalty points when they sign up!
            </p>
          </div>
        )}

        {/* Edit profile */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <button
            onClick={() => setEditing(!editing)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span className="text-gray-700 font-medium">Edit Profile</span>
            <ChevronRight size={18} className={`text-gray-400 transition-transform ${editing ? 'rotate-90' : ''}`} />
          </button>

          {editing && (
            <div className="px-4 pb-4 border-t border-gray-50">
              <label className="block text-xs text-gray-500 mb-1 mt-3">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3 text-sm"
              />
              <label className="block text-xs text-gray-500 mb-1">Phone / M-Pesa Number</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3 text-sm"
              />
              {saveError && <p className="text-red-500 text-xs mb-2">{saveError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setSaveError(''); }}
                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}