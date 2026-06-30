import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { stkPush, checkTransaction } from '../lib/smartpay';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Phone, CheckCircle, Loader, XCircle } from 'lucide-react';

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
  const [step, setStep] = useState<'review' | 'paying' | 'confirming' | 'done' | 'failed'>('review');
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
  const deliveryFee = 150; // minimum delivery fee
  const total = subtotal + deliveryFee;
  const upfront = paymentOption === '100' ? total : paymentOption === '50' ? total * 0.5 : total * 0.3;
  const remaining = total - upfront;

  const pollPayment = async (checkoutRequestId: string, orderId: string): Promise<boolean> => {
    // Poll up to 10 times with 3 second intervals = 30 seconds max
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const result = await checkTransaction(checkoutRequestId);
        if (result?.status === 'completed' || result?.success === true) {
          // Payment confirmed — update order payment status
          await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId);
          return true;
        }
        if (result?.status === 'failed' || result?.status === 'cancelled') {
          // Payment failed — delete the order
          await supabase.from('orders').delete().eq('id', orderId);
          return false;
        }
      } catch {
        // Continue polling on error
      }
    }
    // Timeout — mark as pending for manual review
    return false;
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) { setError('Please enter delivery address'); return; }
    if (!phone) { setError('Phone number required'); return; }
    setError('');
    setLoading(true);

    const formattedPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0+/, '')}`;

    // Step 1: Trigger STK push
    const mpesaRes = await stkPush(formattedPhone, Math.round(upfront), `KE_${Date.now()}`);

    if (!mpesaRes.success) {
      setError(mpesaRes.message || 'M-Pesa payment failed. Check your number and try again.');
      setLoading(false);
      return;
    }

    setStep('paying');

    // Generate a unique 4-digit pickup PIN
    const pickupPin = String(Math.floor(1000 + Math.random() * 9000));

    // Step 2: Create order immediately (payment_status = pending)
    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      customer_id: user!.id,
      restaurant_id: cart[0].restaurant_id,
      delivery_address: address.trim(),
      subtotal: Math.round(subtotal),
      delivery_fee: deliveryFee,
      total_amount: Math.round(total),
      amount_paid_upfront: Math.round(upfront),
      amount_remaining: Math.round(remaining),
      payment_option: paymentOption,
      payment_status: 'pending',
      status: 'pending',
      pickup_pin: pickupPin,
    }).select('id, pickup_pin').single();

    if (orderErr || !order) {
      setError('Failed to create order. Please try again.');
      setLoading(false);
      setStep('review');
      return;
    }

    // Step 3: Insert order items
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

    // Step 4: Log transaction
    await supabase.from('transactions').insert({
      order_id: order.id,
      user_id: user!.id,
      type: 'payment',
      amount: Math.round(upfront),
      checkout_request_id: mpesaRes.checkout_request_id,
      mpesa_phone: formattedPhone,
      description: `Payment for order ${order.id}`,
    });

    setStep('confirming');

    // Step 5: Poll for payment confirmation
    const paid = await pollPayment(mpesaRes.checkout_request_id, order.id);

    setLoading(false);

    if (paid) {
      localStorage.removeItem('cart');
      // Send SMS confirmation to customer
      try {
        await sendSMS(
          formattedPhone,
          `Your Kisii Eats order has been placed! Order ID: ${order.id.slice(0, 8).toUpperCase()}. Track it in the app. Thank you!`
        )
      } catch {
        // SMS failure should not block order confirmation
      }
      setStep('done');
      setTimeout(() => navigate('/orders'), 3000);
    } else {
      setStep('failed');
    }
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
            <p className="text-gray-500">Payment confirmed. Redirecting to your orders...</p>
          </div>

        ) : step === 'failed' ? (
          <div className="text-center py-20">
            <XCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Payment Not Confirmed</h2>
            <p className="text-gray-500 mb-6">Your M-Pesa payment could not be confirmed. Your order has been cancelled.</p>
            <button onClick={() => setStep('review')} className="bg-primary-500 text-white font-semibold py-3 px-8 rounded-xl">
              Try Again
            </button>
          </div>

        ) : step === 'confirming' ? (
          <div className="text-center py-20">
            <Loader size={48} className="animate-spin text-primary-500 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Confirming Payment</h2>
            <p className="text-gray-500">Waiting for M-Pesa confirmation...</p>
            <p className="text-xs text-gray-400 mt-2">This may take up to 30 seconds</p>
          </div>

        ) : step === 'paying' ? (
          <div className="text-center py-20">
            <Loader size={48} className="animate-spin text-primary-500 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Check Your Phone</h2>
            <p className="text-gray-500">Enter your M-Pesa PIN to complete payment</p>
          </div>

        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} /> Delivery Address
              </h3>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Kisii University, Block C Room 12"
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
                {paymentOption === '100'
                  ? 'Pay full amount now'
                  : paymentOption === '50'
                  ? 'Pay half now, half on delivery'
                  : 'Pay 30% now, 70% on delivery'}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="text-sm space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-gray-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>KES {Math.round(item.base_price * item.quantity * 1.1)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2">
                  <div className="flex justify-between text-sm mb-1"><span>Subtotal</span><span>KES {Math.round(subtotal)}</span></div>
                  <div className="flex justify-between text-sm mb-2"><span>Delivery Fee</span><span>KES {deliveryFee}</span></div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span><span className="text-primary-500">KES {Math.round(total)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-primary-500 font-medium border-t border-gray-100 pt-2">
                  <span>Pay Now ({paymentOption}%)</span><span>KES {Math.round(upfront)}</span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Pay on Delivery</span><span>KES {Math.round(remaining)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone size={18} /> M-Pesa Number
              </h3>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-xl">{error}</p>}

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !address.trim() || !phone}
              className="w-full bg-primary-500 text-white font-semibold py-4 rounded-xl disabled:opacity-50 text-lg"
            >
              {loading ? 'Processing...' : `Pay KES ${Math.round(upfront)} via M-Pesa`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}