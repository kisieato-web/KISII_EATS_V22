import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Mail, Lock, User, Phone, Bike, ArrowRight } from 'lucide-react'

export default function RiderSignup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [vehicleType, setVehicleType] = useState('motorcycle')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUpAsRider, getDashboardPath } = useAuth()

  const handleSignUp = async () => {
    setError('')
    if (!name.trim()) { setError('Enter your full name'); return }
    if (!email) { setError('Enter your email'); return }
    if (!phone) { setError('Enter your phone number'); return }
    if (!idNumber.trim()) { setError('Enter your ID number'); return }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    const { error: err, user } = await signUpAsRider(email, password, name.trim(), phone)
    if (err) { setError(err.message); setLoading(false); return }

    if (user) {
      await supabase.from('rider_profiles').insert({
        user_id: user.id,
        id_number: idNumber.trim(),
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate.trim() || null,
        status: 'pending'
      })
    }

    setLoading(false)
    setSuccess(true)

    const path = await getDashboardPath()
    window.location.href = path
  }

  if (success) {
    return (
      <div className="min-h-screen bg-warm-100 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🏍️</div>
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500">Your rider application is under review. We'll notify you once approved.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bike size={32} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Become a Rider</h1>
          <p className="text-gray-500 text-sm mt-1">Earn money delivering with Kisii Eats</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <div className="relative mb-4">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Mwangi"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <div className="relative mb-4">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <div className="relative mb-4">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712 345 678"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">National ID Number *</label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="Your national ID number"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none mb-4"
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none mb-4"
          >
            <option value="motorcycle">Motorcycle</option>
            <option value="boda_boda">Boda Boda</option>
            <option value="car">Car</option>
          </select>

          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Plate (optional)</label>
          <input
            type="text"
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value)}
            placeholder="e.g. KMC 123A"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none mb-4"
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
          <div className="relative mb-4">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Apply as Rider'} <ArrowRight size={18} />
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already a rider? <Link to="/login" className="text-blue-500 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  )
}