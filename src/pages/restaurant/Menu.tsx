import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function RestaurantMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurantId, setRestaurantId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newItem, setNewItem] = useState({ name: '', description: '', base_price: '', category_id: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('restaurants').select('id').eq('owner_id', user.id).single().then(({ data }) => {
      if (!data) { navigate('/restaurant/profile'); return; }
      setRestaurantId(data.id);
      loadMenu(data.id);
    });
  }, [user]);

  const loadMenu = async (rid: string) => {
    const [{ data: cats }, { data: itemsData }] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('restaurant_id', rid).order('display_order'),
      supabase.from('menu_items').select('*').eq('restaurant_id', rid).order('name'),
    ]);
    if (cats) setCategories(cats);
    if (itemsData) setItems(itemsData);
    setLoading(false);
  };

  const addCategory = async () => {
    if (!newCategory) return;
    await supabase.from('menu_categories').insert({ restaurant_id: restaurantId, name: newCategory, display_order: categories.length });
    setNewCategory('');
    setShowAddCategory(false);
    loadMenu(restaurantId);
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.base_price || !newItem.category_id) return;
    await supabase.from('menu_items').insert({
      restaurant_id: restaurantId,
      category_id: newItem.category_id,
      name: newItem.name,
      description: newItem.description,
      base_price: parseFloat(newItem.base_price),
    });
    setNewItem({ name: '', description: '', base_price: '', category_id: '' });
    setShowAddItem(false);
    loadMenu(restaurantId);
  };

  const toggleItem = async (id: string, current: boolean) => {
    await supabase.from('menu_items').update({ is_available: !current }).eq('id', id);
    loadMenu(restaurantId);
  };

  const deleteItem = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id);
    loadMenu(restaurantId);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-warm-100 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/restaurant/dashboard" className="text-gray-600"><ArrowLeft size={20} /></Link>
            <h1 className="font-display font-bold text-xl text-gray-900">Menu</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddCategory(true)} className="text-sm text-secondary-500 font-medium">+ Category</button>
            <button onClick={() => setShowAddItem(true)} className="text-sm bg-primary-500 text-white px-3 py-1 rounded-lg font-medium">+ Item</button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {showAddCategory && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category name" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3" />
            <div className="flex gap-2">
              <button onClick={addCategory} className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowAddCategory(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        {showAddItem && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-2" />
            <input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-2" />
            <input value={newItem.base_price} onChange={(e) => setNewItem({ ...newItem, base_price: e.target.value })} type="number" placeholder="Price (KES)" className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-2" />
            <select value={newItem.category_id} onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-3">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={addItem} className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowAddItem(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        {categories.map(cat => {
          const catItems = items.filter(i => i.category_id === cat.id);
          return (
            <div key={cat.id} className="mb-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">{cat.name}</h3>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                      <p className="text-primary-500 font-semibold">KES {item.base_price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleItem(item.id, item.is_available)} className="text-gray-400">
                        {item.is_available ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-red-400" />}
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
