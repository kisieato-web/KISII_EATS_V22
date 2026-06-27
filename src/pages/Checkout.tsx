import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { stkPush } from '../lib/smartpay';
import Navbar from '../components/Navbar';
import { MapPin, Phone, CheckCircle, Loader } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  base_price: number;
  quantity: number;
  restaurant_id: string;
  restaurant_name: string;
}

export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [paymentOption, setPaymentOption] = useState<'30' | '50' | '100'>('100');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'review' | 'paying' | 'done'>('review');
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    const c = JSON.parse(localStorage.getItem('cart') || '[]');
    if (c.length === 0) { navigate('/cart'); return; }
    setCart(c);

    supabase.from('users').select('phone').eq('id', user.id).single()
      .then(({ data }) => { if (data?.phone) setPhone(data.phone); });
  }, [user, authLoading, navigate]);

  const subtotal = cart.reduce((s, i) => s + i.base_price * i.quantity * 1.1, 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;
  const upfront = paymentOption === '100' ? total : paymentOption === '50' ? total * 0.5 : total * 0.3;
  const remaining = total - upfront;

  const handlePlaceOrder = async () => {
    if (!address) { setError('Please enter delivery address'); return; }
    if (!phone) { setError('Phone number not found'); return; }
    setError('');
    setLoading(true);

    const formattedPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0+/, '')}`;
    const mpesaRes = await stkPush(formattedPhone, Math.round(upfront), `ORDER_${Date.now()}`);

    if (!mpesaRes.success) {
      setError(mpesaRes.message || 'M-Pesa payment failed. Try again.');
      setLoading(false);
      return;
    }

    setStep('paying');

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      customer_id: user!.id,
      restaurant_id: cart[0].restaurant_id,
      delivery_address: address,
      subtotal: Math.round(subtotal),
      payment_option: paymentOption,
      payment_status: 'pending',
    }).select('id').single();

    if (orderErr || !order) {
      setError('Failed to create order');
      setLoading(false);
      setStep('review');
      return;
    }

    const orderItems = cart.map(item => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.name,
      base_price: item.base_price,
      marked_up_price: Math.round(item.base_price * 1.1),
      quantity: item.quantity,
      subtotal: Math.round(item.base_price * item.quantity * 1.1),
    }));

    await supabase.from('order_items').insert(orderItems);

    await supabase.from('transactions').insert({
      order_id: order.id,
      user_id: user!.id,
      type: 'payment',
      amount: Math.round(upfront),
      checkout_request_id: mpesaRes.checkout_request_id,
      mpesa_phone: formattedPhone,
      description: `Payment for order ${order.id}`,
    });

    setLoading(false);
    setStep('done');
    localStorage.removeItem('cart');

    setTimeout(() => navigate('/orders'), 3000);
  };

  if (authLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar title="Checkout" showBack backTo="/cart" />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {step === 'done' ? (
          <div className="text-center py-20 animate-fade-in">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Order Placed!</h2>
            <p className="text-gray-500">Check M-Pesa to complete payment. Redirecting...</p>
          </div>
        ) : step === 'paying' ? (
          <div className="text-center py-20">
            <Loader size={48} className="animate-spin text-primary-500 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Waiting for M-Pesa</h2>
            <p className="text-gray-500">Check your phone and enter your M-Pesa PIN</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><MapPin size={18} /> Delivery Address</h3>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your delivery address"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Option</h3>
              <div className="grid grid-cols-3 gap-3">
                {(['30', '50', '100'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPaymentOption(opt)}
                    className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      paymentOption === opt
                        ? 'border-primary-500 bg-orange-50 text-primary-500'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {opt}%
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {paymentOption === '100' ? 'Pay full amount now' : paymentOption === '50' ? 'Pay half now, half on delivery' : 'Pay 30% now, 70% on delivery'}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between"><span>Subtotal</span><span>KES {subtotal.toFixed(0)}</span></div>
                <div className="flex justify-between"><span>Delivery Fee</span><span>KES {deliveryFee.toFixed(0)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-2">
                  <span>Total</span><span className="text-primary-500">KES {total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm text-primary-500 font-medium">
                  <span>Pay Now ({paymentOption}%)</span><span>KES {upfront.toFixed(0)}</span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Pay on Delivery</span><span>KES {remaining.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Phone size={18} /> M-Pesa Number</h3>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !address}
              className="w-full bg-primary-500 text-white font-semibold py-4 rounded-xl disabled:opacity-50 text-lg"
            >
              {loading ? 'Processing...' : `Pay KES ${upfront.toFixed(0)} via M-Pesa`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
