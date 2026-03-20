import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking, useCancelBooking, useUpdateBooking, useDeleteBooking } from '../../hooks/useBookings';
import StatusBadge from '../../components/common/StatusBadge';
import DateDisplay from '../../components/common/DateDisplay';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { MapPin, Calendar, Truck, Users, Package, CheckCircle, Clock, AlertTriangle, ArrowLeft, Star, MessageCircle, XCircle, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import type { Booking } from '../../types';

// ─── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const cancel = useCancelBooking();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    await cancel.mutateAsync({ bookingId: booking._id, cancellationReason: reason });
    onClose();
    navigate('/bookings');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <XCircle size={18} className="text-red-500" /> Cancel Booking
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to cancel booking <span className="font-semibold">{booking.bookingNumber}</span>? This cannot be undone.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
            <textarea
              className="input w-full resize-none"
              rows={3}
              placeholder="Let us know why you're cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Keep Booking</button>
          <button
            onClick={handleConfirm}
            disabled={cancel.isPending}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {cancel.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const update = useUpdateBooking();
  const [form, setForm] = useState({
    moveDate: booking.moveDate ? new Date(booking.moveDate).toISOString().slice(0, 10) : '',
    moveTime: booking.moveTime || '',
    specialInstructions: booking.specialInstructions || '',
    pickupStreet: booking.pickupAddress.street,
    pickupCity: booking.pickupAddress.city,
    pickupProvince: booking.pickupAddress.province,
    pickupPostalCode: booking.pickupAddress.postalCode,
    destStreet: booking.destinationAddress.street,
    destCity: booking.destinationAddress.city,
    destProvince: booking.destinationAddress.province,
    destPostalCode: booking.destinationAddress.postalCode,
  });

  const handleSave = async () => {
    await update.mutateAsync({
      bookingId: booking._id,
      data: {
        moveDate: form.moveDate,
        moveTime: form.moveTime,
        specialInstructions: form.specialInstructions,
        pickupAddress: {
          street: form.pickupStreet,
          city: form.pickupCity,
          province: form.pickupProvince,
          postalCode: form.pickupPostalCode,
          country: booking.pickupAddress.country || 'Canada',
        },
        destinationAddress: {
          street: form.destStreet,
          city: form.destCity,
          province: form.destProvince,
          postalCode: form.destPostalCode,
          country: booking.destinationAddress.country || 'Canada',
        },
      },
    });
    onClose();
  };

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        className="input w-full text-sm"
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-4">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Pencil size={16} className="text-primary-500" /> Edit Booking
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {field('Move Date', 'moveDate', 'date')}
            {field('Move Time', 'moveTime')}
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Pickup Address</p>
          {field('Street', 'pickupStreet')}
          <div className="grid grid-cols-3 gap-3">
            {field('City', 'pickupCity')}
            {field('Province', 'pickupProvince')}
            {field('Postal Code', 'pickupPostalCode')}
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Destination Address</p>
          {field('Street', 'destStreet')}
          <div className="grid grid-cols-3 gap-3">
            {field('City', 'destCity')}
            {field('Province', 'destProvince')}
            {field('Postal Code', 'destPostalCode')}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Special Instructions</label>
            <textarea
              className="input w-full resize-none text-sm"
              rows={3}
              value={form.specialInstructions}
              onChange={(e) => setForm((f) => ({ ...f, specialInstructions: e.target.value }))}
            />
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Discard</button>
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ───────────────────────────────────────────────────────
function DeleteModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const del = useDeleteBooking();
  const navigate = useNavigate();

  const handleDelete = async () => {
    await del.mutateAsync(booking._id);
    onClose();
    navigate('/bookings');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Trash2 size={18} className="text-red-500" /> Delete Booking
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600">
            Permanently delete booking <span className="font-semibold">{booking.bookingNumber}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Keep</button>
          <button
            onClick={handleDelete}
            disabled={del.isPending}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {del.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useBooking(id!);
  const booking = data?.data;
  const [showCancel, setShowCancel] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (error || !booking) return (
    <div className="card text-center py-12">
      <AlertTriangle size={40} className="mx-auto text-amber-400 mb-3" />
      <p className="text-slate-700 font-semibold">Booking not found</p>
      <button onClick={() => navigate('/bookings')} className="btn-secondary mt-4 text-sm">Back to Bookings</button>
    </div>
  );

  const timelineIcons: Record<string, JSX.Element> = {
    Pending: <Clock size={14} />, Confirmed: <CheckCircle size={14} />, Scheduled: <Calendar size={14} />,
    InProgress: <Truck size={14} />, Completed: <CheckCircle size={14} />, Cancelled: <AlertTriangle size={14} />,
  };

  const canCancel = ['Pending', 'Confirmed'].includes(booking.status);
  const canEdit = booking.status === 'Pending';
  const canDelete = booking.status === 'Pending';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {showCancel && <CancelModal booking={booking} onClose={() => setShowCancel(false)} />}
      {showEdit && <EditModal booking={booking} onClose={() => setShowEdit(false)} />}
      {showDelete && <DeleteModal booking={booking} onClose={() => setShowDelete(false)} />}
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/bookings')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{booking.bookingNumber}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-slate-500">Booked <DateDisplay date={booking.createdAt} format="PPP" /></p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {booking.status === 'InProgress' && (
          <button onClick={() => navigate(`/tracking/${booking._id}`)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Truck size={15} /> Track Live
          </button>
        )}
        {booking.status === 'Completed' && (
          <button onClick={() => navigate(`/review/${booking._id}`)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Star size={15} /> Leave a Review
          </button>
        )}
        {canEdit && (
          <button onClick={() => setShowEdit(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
            <Pencil size={15} /> Edit Booking
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => setShowCancel(true)}
            className="border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <XCircle size={15} /> Cancel
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => setShowDelete(true)}
            className="border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={15} /> Delete
          </button>
        )}
        <button onClick={() => navigate('/chat')} className="btn-secondary flex items-center gap-1.5 text-sm">
          <MessageCircle size={15} /> Get Support
        </button>
      </div>

      {/* Address Card */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={16} className="text-primary-500" /> Move Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">PICKUP</p>
            <p className="font-medium text-slate-900">{booking.pickupAddress.street}</p>
            <p className="text-sm text-slate-600">{booking.pickupAddress.city}, {booking.pickupAddress.province} {booking.pickupAddress.postalCode}</p>
            {booking.pickupAddress.floorNumber && <p className="text-sm text-slate-500">Floor {booking.pickupAddress.floorNumber}</p>}
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">DESTINATION</p>
            <p className="font-medium text-slate-900">{booking.destinationAddress.street}</p>
            <p className="text-sm text-slate-600">{booking.destinationAddress.city}, {booking.destinationAddress.province} {booking.destinationAddress.postalCode}</p>
            {booking.destinationAddress.floorNumber && <p className="text-sm text-slate-500">Floor {booking.destinationAddress.floorNumber}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 border-t pt-4">
          <span className="flex items-center gap-1.5"><Calendar size={14} /><DateDisplay date={booking.moveDate} format="PPpp" /></span>
          <span className="flex items-center gap-1.5"><Package size={14} />{booking.moveSize}</span>
          {booking.numberOfBedrooms > 0 && <span>{booking.numberOfBedrooms} bedroom{booking.numberOfBedrooms > 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* AI Estimate */}
      {booking.aiEstimate && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Package size={16} className="text-primary-500" /> Price Estimate
            {booking.aiEstimate.needsManualReview && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-2">Manual Review</span>
            )}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-primary-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary-700">${booking.aiEstimate.estimatedPrice.toLocaleString()}</p>
              <p className="text-xs text-primary-600 mt-0.5">Estimated Price</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-slate-900">{booking.aiEstimate.estimatedVolume}</p>
              <p className="text-xs text-slate-500 mt-0.5">Cu ft</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-slate-900">{booking.aiEstimate.loadingTime}h</p>
              <p className="text-xs text-slate-500 mt-0.5">Loading time</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-slate-900">{booking.aiEstimate.recommendedTruck}</p>
              <p className="text-xs text-slate-500 mt-0.5">Truck type</p>
            </div>
          </div>
          {booking.aiEstimate.aiConfidence > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${booking.aiEstimate.aiConfidence * 100}%` }} />
              </div>
              <span>{Math.round(booking.aiEstimate.aiConfidence * 100)}% AI confidence</span>
            </div>
          )}
        </div>
      )}

      {/* Crew Assignment */}
      {booking.crewAssignment && (booking.crewAssignment.driver || (booking.crewAssignment.movers?.length ?? 0) > 0) && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Users size={16} className="text-primary-500" /> Your Crew</h2>
          <div className="space-y-2 text-sm">
            {booking.crewAssignment.truck && (
              <div className="flex items-center gap-2 text-slate-600">
                <Truck size={14} className="text-slate-400" />
                Truck: <span className="font-medium text-slate-800">{booking.crewAssignment.truck}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photos */}
      {booking.itemPhotos && booking.itemPhotos.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Package size={16} className="text-primary-500" /> Item Photos</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {booking.itemPhotos.map((url, i) => (
              <img key={i} src={url} alt={`Item ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Special Items */}
      {booking.specialItems && booking.specialItems.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-3">Special Items</h2>
          <div className="flex flex-wrap gap-2">
            {booking.specialItems.map((item, i) => (
              <span key={i} className="bg-amber-50 text-amber-700 text-sm px-3 py-1 rounded-full border border-amber-200">{item}</span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {booking.timeline && booking.timeline.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Booking Timeline</h2>
          <div className="space-y-3">
            {[...booking.timeline].reverse().map((entry, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0 text-primary-600">
                  {timelineIcons[entry.status] || <Clock size={14} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{entry.status}</p>
                  {entry.note && <p className="text-xs text-slate-500 mt-0.5">{entry.note}</p>}
                  <p className="text-xs text-slate-400 mt-0.5"><DateDisplay date={entry.timestamp} format="PPpp" /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
