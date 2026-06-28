import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { Trash2, Minus, Plus } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  base_price: number;
  quantity: number;
  restaurant_id: string;
  restaurant_name: string;
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeItem = (id: string) => updateCart(cart.filter(i => i.id !== id));
  const changeQty = (id: string, delta: number) => {
    updateCart(cart.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  // Subtotal includes 10% markup
  const subtotal = cart.reduce((sum, i) => sum + (i.base_price * 1.1) * i.quantity, 0);
  const deliveryFee = 150; // minimum — actual calculated at checkout based on distance
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar title="Cart" showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {cart.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🛒</p>
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link to="/dashboard" className="bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl inline-block">
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">{cart[0].restaurant_name}</h3>
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-primary-500">KES {Math.round(item.base_price * 1.1)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQty(item.id, -1)}
                      className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => changeQty(item.id, 1)}
                      className="w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="ml-3 text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">KES {Math.round(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="text-gray-400 text-xs">From KES {deliveryFee} (calculated at checkout)</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-2">
                <span>Estimated Total</span>
                <span className="text-primary-500">~KES {Math.round(total)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full bg-primary-500 text-white font-semibold py-4 rounded-xl text-center block text-lg"
            >
              Proceed to Checkout
            </Link>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}