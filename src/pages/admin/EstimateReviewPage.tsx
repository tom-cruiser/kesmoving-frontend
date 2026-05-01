import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estimateApi } from '../../services/api';
import { CheckCircle, AlertTriangle, Edit2, X, Loader2, Package, ChevronDown, ChevronUp } from 'lucide-react';
import type { Booking, ItemPhoto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateDisplay from '../../components/common/DateDisplay';
import toast from 'react-hot-toast';

interface OverrideForm {
  estimatedPrice: string;
  estimatedVolume: string;
  loadingTime: string;
  recommendedTruck: string;
  notes: string;
}

const TRUCK_TYPES = ['Small Truck', 'Medium Truck', 'Large Truck', 'Extra Large Truck'];

function EstimateCard({ booking, onOverride }: { booking: Booking; onOverride: (b: Booking) => void }) {
  const [expanded, setExpanded] = useState(false);
  const est = booking.aiEstimate;

  const photoUrl = (photo: string | ItemPhoto) => (typeof photo === 'string' ? photo : photo.url);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 text-sm">{booking.bookingNumber}</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle size={11} />
              Needs Review
            </span>
          </div>
          <p className="text-sm text-slate-500">{booking.pickupAddress.city} → {booking.destinationAddress.city}</p>
          <p className="text-xs text-slate-400 mt-0.5"><DateDisplay date={booking.moveDate} format="PPP" /></p>
        </div>
        <button onClick={() => setExpanded((e) => !e)} className="p-1.5 rounded-lg hover:bg-slate-100">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-primary-50 rounded-lg p-2 text-center">
          <p className="font-bold text-primary-700 text-lg">{est?.loadingTime != null ? `${est.loadingTime} h` : '—'}</p>
          <p className="text-xs text-primary-600">Load Time</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <p className="font-bold text-slate-900">{est?.estimatedPrice != null ? `$${est.estimatedPrice.toLocaleString()}` : '—'}</p>
          <p className="text-xs text-slate-500">Price</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <p className="font-bold text-slate-900">{est?.estimatedVolume != null ? `${est.estimatedVolume} ft³` : '—'}</p>
          <p className="text-xs text-slate-500">Volume</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <p className="font-semibold text-slate-900 text-xs">{est?.recommendedTruck ?? '—'}</p>
          <p className="text-xs text-slate-500">Truck</p>
        </div>
      </div>

      {est && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>AI Confidence</span>
            <span>{Math.round((est.aiConfidence || 0) * 100)}%</span>
          </div>
          <div className="bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${(est.aiConfidence || 0) < 0.5 ? 'bg-red-400' : (est.aiConfidence || 0) < 0.7 ? 'bg-amber-400' : 'bg-green-400'}`}
              style={{ width: `${(est.aiConfidence || 0) * 100}%` }}
            />
          </div>
        </div>
      )}

      {expanded && est?.itemsDetected && est.itemsDetected.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-600 mb-1">Detected Items</p>
          <div className="flex flex-wrap gap-1">
            {est.itemsDetected.map((item, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
            ))}
          </div>
        </div>
      )}

      {booking.itemPhotos && booking.itemPhotos.length > 0 && expanded && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-600 mb-1">Photos ({booking.itemPhotos.length})</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {booking.itemPhotos.map((photo, i) => (
              <img key={i} src={photoUrl(photo)} alt={`Item ${i}`} className="h-16 w-16 object-cover rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onOverride(booking)}
        className="w-full btn-primary text-sm flex items-center justify-center gap-1.5"
      >
        <Edit2 size={14} />
        Review & Approve Estimate
      </button>
    </div>
  );
}

function OverrideModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const qc = useQueryClient();
  const est = booking.aiEstimate;
  const [form, setForm] = useState<OverrideForm>({
    estimatedPrice: String(est?.estimatedPrice || ''),
    estimatedVolume: String(est?.estimatedVolume || ''),
    loadingTime: String(est?.loadingTime || ''),
    recommendedTruck: est?.recommendedTruck || 'Medium Truck',
    notes: '',
  });

  const approve = useMutation({
    mutationFn: (data: object) => estimateApi.approveManual(booking._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['estimates-pending'] }); toast.success('Estimate approved'); onClose(); },
    onError: () => toast.error('Failed to approve estimate'),
  });

  const set = (key: keyof OverrideForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Review AI Estimate</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 text-sm">
            <p className="font-medium">{booking.bookingNumber}</p>
            <p className="text-slate-500">{booking.pickupAddress.city} → {booking.destinationAddress.city} · {booking.moveSize || booking.moveType}</p>
          </div>
          <div>
            <label className="label">Final Price (CAD)</label>
            <input type="number" className="input" value={form.estimatedPrice} onChange={(e) => set('estimatedPrice', e.target.value)} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Volume (cu ft)</label>
              <input type="number" className="input" value={form.estimatedVolume} onChange={(e) => set('estimatedVolume', e.target.value)} />
            </div>
            <div>
              <label className="label">Loading Time (hrs)</label>
              <input type="number" step="0.5" className="input" value={form.loadingTime} onChange={(e) => set('loadingTime', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Truck Type</label>
            <select className="input" value={form.recommendedTruck} onChange={(e) => set('recommendedTruck', e.target.value)}>
              {TRUCK_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes for Client</label>
            <textarea className="input min-h-[72px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Explain any adjustments..." />
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={() => approve.mutate({
              estimatedPrice: parseFloat(form.estimatedPrice) || 0,
              estimatedVolume: parseFloat(form.estimatedVolume) || 0,
              loadingTime: parseFloat(form.loadingTime) || 0,
              recommendedTruck: form.recommendedTruck,
              notes: form.notes,
            })}
            disabled={approve.isPending}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            {approve.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Save Changes & Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EstimateReviewPage() {
  const [overrideBooking, setOverrideBooking] = useState<Booking | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['estimates-pending'],
    queryFn: () => estimateApi.getPendingReview(),
    refetchInterval: 30000,
  });

  const bookings: Booking[] = data?.data?.data || [];

  return (
    <div className="space-y-5 animate-fade-in">
      {overrideBooking && <OverrideModal booking={overrideBooking} onClose={() => setOverrideBooking(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Estimate Review</h1>
        <p className="text-slate-500 text-sm">Bookings requiring manual estimate approval</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-slate-700 font-semibold">All caught up!</p>
          <p className="text-slate-400 text-sm mt-1">No AI estimates waiting for approval</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <AlertTriangle size={16} />
            <span><strong>{bookings.length}</strong> booking{bookings.length > 1 ? 's' : ''} awaiting admin approval for AI-generated estimates</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.map((b) => (
              <EstimateCard key={b._id} booking={b} onOverride={setOverrideBooking} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
