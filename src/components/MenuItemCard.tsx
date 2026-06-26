import { Plus } from 'lucide-react';

interface MenuItemCardProps {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  marked_up_price: number;
  image_url?: string;
  is_available: boolean;
  onAdd: (id: string) => void;
}

export default function MenuItemCard({ id, name, description, base_price, marked_up_price, image_url, is_available, onAdd }: MenuItemCardProps) {
  return (
    <div className={`bg-white rounded-xl p-4 flex gap-3 border border-gray-100 ${!is_available ? 'opacity-50' : ''}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">
        {image_url ? <img src={image_url} alt={name} className="w-full h-full object-cover rounded-lg" /> : '🍽️'}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900">{name}</h4>
        {description && <p className="text-xs text-gray-500 line-clamp-1">{description}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-primary-500">KES {marked_up_price.toFixed(0)}</span>
          {marked_up_price > base_price && (
            <span className="text-xs text-gray-400 line-through">KES {base_price.toFixed(0)}</span>
          )}
        </div>
      </div>
      {is_available && (
        <button onClick={() => onAdd(id)} className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center self-center flex-shrink-0">
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}
