import { Link } from 'react-router-dom'
import { Phone, ShoppingBag, Truck, Users, Star, Shield, Zap, ChevronRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-warm-100">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">KE</span>
            </div>
            <span className="font-display font-bold text-xl">
              Kisii<span className="text-primary-500">Eats</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/rider/signup" className="text-sm text-gray-600 hidden sm:block">Become a Rider</Link>
            <Link to="/login" className="bg-primary-500 text-white text-sm font-semibold py-2 px-5 rounded-xl">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-primary-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap size={16} /> Now delivering in Kisii County
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-gray-900 leading-tight mb-6">
              Food & Errands <span className="text-primary-500">Delivered</span> in Kisii
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md">
              Order from your favorite local restaurants. Pay with M-Pesa. Fast delivery to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <div className="flex-1 relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" placeholder="07XX XXX XXX" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none" />
              </div>
              <Link to="/signup" className="bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl text-center whitespace-nowrap">
                Get Started
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500" /> 4.8 rating</span>
              <span className="flex items-center gap-1"><Shield size={14} className="text-green-500" /> Secure M-Pesa</span>
              <span className="flex items-center gap-1"><Truck size={14} className="text-primary-500" /> Fast delivery</span>
            </div>
          </div>
          <div className="aspect-square bg-gradient-to-br from-orange-100 to-green-100 rounded-3xl flex items-center justify-center animate-slide-up">
            <div className="text-center">
              <ShoppingBag size={64} className="text-primary-500 mx-auto mb-4" />
              <p className="text-gray-500">Your favorite food, delivered</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-center mb-4">How It Works</h2>
          <p className="text-center text-gray-600 mb-12">Three simple steps</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: '📱', title: 'Browse', desc: 'Explore restaurants near you in Kisii' },
              { emoji: '🛒', title: 'Order', desc: 'Add items to cart and pay with M-Pesa' },
              { emoji: '🏍️', title: 'Delivered', desc: 'Track your rider in real-time' }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">{step.emoji}</div>
                <h3 className="font-semibold text-lg mb-2">{i + 1}. {step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-center mb-12">Why Kisii Eats?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Truck, color: 'text-primary-500 bg-orange-100', title: 'Fast Boda Boda Delivery', desc: 'Real-time GPS tracking. Know where your order is.' },
              { icon: Phone, color: 'text-green-600 bg-green-100', title: 'Flexible M-Pesa Payments', desc: 'Pay 30%, 50%, or 100% upfront.' },
              { icon: Users, color: 'text-blue-600 bg-blue-100', title: 'Group Orders', desc: 'Order together, split the bill, save on delivery.' },
              { icon: Star, color: 'text-yellow-600 bg-yellow-100', title: 'Local Restaurants', desc: 'Support Kisii businesses. Discover local flavors.' }
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                  <f.icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR BUSINESSES */}
      <section className="py-16 px-4 bg-secondary-500 text-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-white/10 rounded-2xl p-8 text-center">
            <div className="text-3xl mb-4">🍽️</div>
            <h3 className="font-display font-bold text-2xl mb-2">Own a Restaurant?</h3>
            <p className="text-white/80 mb-6">Reach more customers. We handle delivery.</p>
            <Link to="/restaurant/signup" className="inline-flex items-center gap-2 bg-white text-secondary-600 font-semibold py-3 px-6 rounded-xl">
              Partner With Us <ChevronRight size={18} />
            </Link>
          </div>
          <div className="bg-white/10 rounded-2xl p-8 text-center">
            <div className="text-3xl mb-4">🏍️</div>
            <h3 className="font-display font-bold text-2xl mb-2">Become a Rider</h3>
            <p className="text-white/80 mb-6">Earn money delivering on your boda boda.</p>
            <Link to="/rider/signup" className="inline-flex items-center gap-2 bg-white text-secondary-600 font-semibold py-3 px-6 rounded-xl">
              Start Earning <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">KE</span>
            </div>
            <span className="font-display font-bold text-xl text-white">Kisii<span className="text-primary-400">Eats</span></span>
          </div>
          <p className="text-sm mb-2">📧 jannesokumu20@gmail.com | 📞 0743 053 511</p>
          <p className="text-sm">&copy; {new Date().getFullYear()} Kisii Eats. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
