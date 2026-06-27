import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, User, Phone, Store, MapPin, ArrowRight } from 'lucide-react'

export default function RestaurantSignup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUpAsRestaurant, getDashboardPath } = useAuth()

  const handleSignUp = async () => {
    setError('')
    if (!name.trim()) { setError('Enter your full name'); return }
    if (!email) { setError('Enter your email'); return }
    if (!phone) { setError('Enter your phone number'); return }
    if (!password || password.length < 6) { setError('Password min 6 characters'); return }
    if (!restaurantName.trim()) { setError('Enter restaurant name'); return }
    if (!address.trim()) { setError('Enter restaurant address'); return }

    setLoading(true)
    const { error: err } = await signUpAsRestaurant(email, password, name.trim(), phone, restaurantName.trim(), address.trim(), description.trim())
    setLoading(false)
    if (err) { setError(err.message); return }
    const path = await getDashboardPath()
    window.location.href = path
  }

  return (
    <div className="min-h-screen bg-warm-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Partner With Us</h1>
          <p className="text-gray-500 text-sm mt-1">List your restaurant on Busia Fast Food</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Full Name *</label>
          <div className="relative mb-4">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Mwangi" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-700 focus:ring-2 focus:ring-green-100 outline-none" />
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
          <div className="relative mb-4">
            <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="Your Restaurant Name" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-700 focus:ring-2 focus:ring-green-100 outline-none" />
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
          <div className="relative mb-4">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Busia Town, near..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-700 focus:ring-2 focus:ring-green-100 outline-none" />
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers about your restaurant..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-700 focus:ring-2 focus:ring-green-100 outline-none mb-4" rows={3} />
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <div className="relative mb-4">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-700 focus:ring-2 focus:ring-green-100 outline-none" />
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <div className="relative mb-4">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-700 focus:ring-2 focus:ring-green-100 outline-none" />
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
          <div className="relative mb-4">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-700 focus:ring-2 focus:ring-green-100 outline-none" />
          </div>
          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}
          <button onClick={handleSignUp} disabled={loading} className="w-full bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? 'Registering...' : 'Register Restaurant'} <ArrowRight size={18} />
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already a partner? <Link to="/login" className="text-green-700 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  )
}