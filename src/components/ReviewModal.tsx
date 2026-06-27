import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ReviewModalProps {
  orderId: string;
  restaurantId: string;
  riderId: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewModal({ orderId, restaurantId, riderId, onClose, onSubmitted }: ReviewModalProps) {
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [restaurantReview, setRestaurantReview] = useState('');
  const [riderRating, setRiderRating] = useState(0);
  const [riderReview, setRiderReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (restaurantRating === 0) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('reviews').insert({
      order_id: orderId,
      restaurant_id: restaurantId,
      rider_id: riderId || null,
      restaurant_rating: restaurantRating,
      restaurant_review: restaurantReview || null,
      rider_rating: riderId ? riderRating : null,
      rider_review: riderId ? riderReview || null : null,
      customer_id: user?.id,
    });
    setSubmitting(false);
    onSubmitted();
  };

  const StarRating = ({ rating, setRating }: { rating: number; setRating: (r: number) => void }) => (
    <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => setRating(star)} className="text-2xl">{star <= rating ? '⭐' : '☆'}</button>))}</div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h2 className="font-display font-bold text-lg">Rate Your Order</h2><button onClick={onClose}><X size={20} className="text-gray-400" /></button></div>
        <div className="mb-6"><p className="font-medium text-gray-900 mb-2">🍽️ Restaurant</p><StarRating rating={restaurantRating} setRating={setRestaurantRating} /><textarea value={restaurantReview} onChange={(e) => setRestaurantReview(e.target.value)} placeholder="How was the food? (optional)" className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm" rows={2} /></div>
        {riderId && (<div className="mb-6"><p className="font-medium text-gray-900 mb-2">🏍️ Rider</p><StarRating rating={riderRating} setRating={setRiderRating} /><textarea value={riderReview} onChange={(e) => setRiderReview(e.target.value)} placeholder="How was the delivery? (optional)" className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 text-sm" rows={2} /></div>)}
        <button onClick={handleSubmit} disabled={restaurantRating === 0 || submitting} className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Review'}</button>
      </div>
    </div>
  );
}
