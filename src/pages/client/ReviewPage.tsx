import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../../hooks/useBookings';
import { reviewApi } from '../../services/api';
import { Star, Truck, Users, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

interface RatingField {
  key: 'overall' | 'professionalism' | 'punctuality' | 'careOfBelongings' | 'communication';
  label: string;
  icon: JSX.Element;
}

const RATING_FIELDS: RatingField[] = [
  { key: 'overall', label: 'Overall Experience', icon: <Star size={16} /> },
  { key: 'professionalism', label: 'Professionalism', icon: <Users size={16} /> },
  { key: 'punctuality', label: 'Punctuality', icon: <CheckCircle size={16} /> },
  { key: 'careOfBelongings', label: 'Care of Belongings', icon: <Truck size={16} /> },
  { key: 'communication', label: 'Communication', icon: <CheckCircle size={16} /> },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={`transition-colors ${(hover || value) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { data: bookingData, isLoading } = useBooking(bookingId!);
  const booking = bookingData?.data;

  const [ratings, setRatings] = useState({ overall: 0, professionalism: 0, punctuality: 0, careOfBelongings: 0, communication: 0 });
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setRating = (key: RatingField['key'], value: number) => setRatings((r) => ({ ...r, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ratings.overall === 0) { toast.error('Please provide an overall rating'); return; }
    setSubmitting(true);
    try {
      await reviewApi.create({ booking: bookingId!, ...ratings, comment, isPublic });
      setSubmitted(true);
      toast.success('Thank you for your review!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  if (booking?.status !== 'Completed' && !submitted) {
    return (
      <div className="card text-center py-12 max-w-md mx-auto">
        <Star size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-700 font-semibold">Review not available</p>
        <p className="text-slate-500 text-sm mt-1">You can leave a review after your move is completed</p>
        <button onClick={() => navigate('/bookings')} className="btn-secondary mt-4 text-sm">Back to Bookings</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="card text-center py-12 max-w-md mx-auto animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Thank You!</h2>
        <p className="text-slate-500 mt-2 text-sm">Your review has been submitted. We appreciate your feedback!</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-6 text-sm">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/bookings/${bookingId}`)} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave a Review</h1>
          {booking && <p className="text-sm text-slate-500">{booking.bookingNumber} · {booking.pickupAddress.city} → {booking.destinationAddress.city}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {RATING_FIELDS.map(({ key, label, icon }) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
              <span className="text-primary-500">{icon}</span>
              {label}
              {key === 'overall' && <span className="text-red-500">*</span>}
            </div>
            <StarRating value={ratings[key]} onChange={(v) => setRating(key, v)} />
          </div>
        ))}

        <div>
          <label className="label">Your Comments</label>
          <textarea
            className="input min-h-[100px]"
            placeholder="Tell us about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded" />
            Make this review public (visible to other customers)
          </label>
        </div>

        <button type="submit" disabled={submitting || ratings.overall === 0} className="btn-primary w-full flex items-center justify-center gap-2">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
          Submit Review
        </button>
      </form>
    </div>
  );
}
