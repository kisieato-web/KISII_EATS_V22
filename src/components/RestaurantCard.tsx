import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';

interface RestaurantCardProps {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  average_rating: number;
  is_open: boolean;
  delivery_time?: string;
}

export default function RestaurantCard({ id, name, description, logo_url, average_rating, is_open, delivery_time }: RestaurantCardProps) {
  return (
    <Link to={`/restaurant/${id}`} className="block">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-32 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
          {logo_url ? (
            <img src={logo_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">🍽️</span>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {is_open ? 'Open' : 'Closed'}
            </span>
          </div>
          {description && <p className="text-sm text-gray-500 mb-2 line-clamp-1">{description}</p>}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" /> {average_rating.toFixed(1)}</span>
            {delivery_time && <span className="flex items-center gap-1"><Clock size={12} /> {delivery_time}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
