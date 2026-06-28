import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import MenuItemCard from '../components/MenuItemCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Star, Clock, MapPin, ShoppingCart } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  is_available: boolean;
  category_id: string;
}

interface MenuCategory {
  id: string;
  name: string;
}

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [addedItem, setAddedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('restaurants').select('*').eq('id', id).single(),
      supabase.from('menu_categories').select('id, name').eq('restaurant_id', id).order('display_order'),
      supabase.from('menu_items').select('*').eq('restaurant_id', id).eq('is_available', true),
    ]).then(([r, c, i]) => {
      if (r.data) setRestaurant(r.data);
      if (c.data) setCategories(c.data);
      if (i.data) setItems(i.data as MenuItem[]);
      setLoading(false);
    });

    // Sync cart count
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0));
  }, [id]);

  const handleAddToCart = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Clear cart if switching restaurants
    if (cart.length > 0 && cart[0].restaurant_id !== id) {
      if (!window.confirm('Your cart has items from another restaurant. Clear cart and start fresh?')) return;
      cart.length = 0;
    }

    const existing = cart.find((c: any) => c.id === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: itemId,
        name: item.name,
        base_price: item.base_price,
        quantity: 1,
        restaurant_id: id,
        restaurant_name: restaurant?.name
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0));

    // Flash feedback
    setAddedItem(itemId);
    setTimeout(() => setAddedItem(null), 1000);
  };

  if (loading) return <LoadingSpinner />;
  if (!restaurant) return <p className="text-center py-20 text-gray-500">Restaurant not found</p>;

  const markedUpPrice = (base: number) => base * 1.1;

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar title={restaurant.name} showBack backTo="/dashboard" />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">

        {/* Restaurant info */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              🍽️
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-xl text-gray-900 truncate">{restaurant.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  {restaurant.average_rating?.toFixed(1) || '–'}
                </span>
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={14} className="flex-shrink-0" /> {restaurant.address}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              restaurant.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {restaurant.is_open ? '● Open' : '● Closed'}
            </span>
            {restaurant.opening_time && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> {restaurant.opening_time} – {restaurant.closing_time}
              </span>
            )}
          </div>

          {restaurant.description && (
            <p className="text-sm text-gray-500 mt-3">{restaurant.description}</p>
          )}

          {!restaurant.is_open && (
            <div className="mt-3 bg-red-50 rounded-xl p-3 text-sm text-red-600">
              This restaurant is currently closed. You can still browse the menu.
            </div>
          )}
        </div>

        {/* Menu by category */}
        {categories.map((cat) => {
          const catItems = items.filter(i => i.category_id === cat.id);
          if (catItems.length === 0) return null;
          return (
            <div key={cat.id} className="mb-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">{cat.name}</h3>
              <div className="space-y-3">
                {catItems.map((item) => (
                  <div key={item.id} className="relative">
                    <MenuItemCard
                      {...item}
                      marked_up_price={markedUpPrice(item.base_price)}
                      onAdd={handleAddToCart}
                    />
                    {addedItem === item.id && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Added!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Uncategorised items */}
        {items.filter(i => !categories.find(c => c.id === i.category_id)).length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-3">Other Items</h3>
            <div className="space-y-3">
              {items.filter(i => !categories.find(c => c.id === i.category_id)).map((item) => (
                <MenuItemCard
                  key={item.id}
                  {...item}
                  marked_up_price={markedUpPrice(item.base_price)}
                  onAdd={handleAddToCart}
                />
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <p className="text-center text-gray-500 py-12">No menu items available yet</p>
        )}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
          <button
            onClick={() => navigate('/cart')}
            className="bg-primary-500 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg flex items-center gap-3"
          >
            <ShoppingCart size={20} />
            View Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </button>
        </div>
      )}
    </div>
  );
}