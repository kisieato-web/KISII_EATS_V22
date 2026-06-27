import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import RestaurantCard from '../components/RestaurantCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  average_rating: number;
  is_open: boolean;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    supabase
      .from('restaurants')
      .select('id, name, description, logo_url, average_rating, is_open')
      .eq('status', 'active')
      .order('average_rating', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setRestaurants(data as Restaurant[]);
        setDataLoading(false);
      });
  }, [user, authLoading, navigate]);

  if (authLoading || dataLoading) return <LoadingSpinner />;

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-warm-100">
      <Navbar title="Kisii Eats" />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-orange-100 outline-none"
          />
        </div>
        <h2 className="font-display font-bold text-xl text-gray-900 mb-4">
          {search ? `Results for "${search}"` : 'Restaurants Near You'}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} {...r} />
          ))}
        </div>
        {filtered.length === 0 && !dataLoading && (
          <p className="text-center text-gray-500 py-12">
            No restaurants found
          </p>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
