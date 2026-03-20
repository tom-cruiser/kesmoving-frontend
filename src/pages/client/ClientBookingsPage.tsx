import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Filter, Search, Plus, XCircle, Trash2 } from 'lucide-react';
import { useBookings, useCancelBooking, useDeleteBooking } from '../../hooks/useBookings';
import StatusBadge from '../../components/common/StatusBadge';
import DateDisplay from '../../components/common/DateDisplay';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { Booking, BookingStatus } from '../../types';

const STATUS_OPTIONS: BookingStatus[] = ['Pending','Confirmed','Scheduled','InProgress','Completed','Cancelled'];

export default function ClientBookingsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingCancel, setPendingCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Booking | null>(null);

  const { data, isLoading } = useBookings({ status: status || undefined, page, limit: 10 });
  const cancelMutation = useCancelBooking();
  const deleteMutation = useDeleteBooking();
  const bookings = data?.data || [];
  const pagination = data?.pagination;

  const filtered = search.trim()
    ? bookings.filter((b) =>
        b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.pickupAddress.city.toLowerCase().includes(search.toLowerCase()) ||
        b.destinationAddress.city.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cancel Confirmation */}
      {pendingCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-slate-900">Cancel Booking</h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600">Cancel <span className="font-semibold">{pendingCancel.bookingNumber}</span>?</p>
              <textarea
                className="input w-full resize-none text-sm"
                rows={3}
                placeholder="Reason (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button onClick={() => { setPendingCancel(null); setCancelReason(''); }} className="btn-secondary text-sm">Keep</button>
              <button
                disabled={cancelMutation.isPending}
                onClick={async () => {
                  await cancelMutation.mutateAsync({ bookingId: pendingCancel._id, cancellationReason: cancelReason });
                  setPendingCancel(null);
                  setCancelReason('');
                }}
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-slate-900">Delete Booking</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600">Permanently delete <span className="font-semibold">{pendingDelete.bookingNumber}</span>? This cannot be undone.</p>
            </div>
            <div className="p-5 border-t flex justify-end gap-2">
              <button onClick={() => setPendingDelete(null)} className="btn-secondary text-sm">Keep</button>
              <button
                disabled={deleteMutation.isPending}
                onClick={async () => {
                  await deleteMutation.mutateAsync(pendingDelete._id);
                  setPendingDelete(null);
                }}
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
        <button onClick={() => navigate('/bookings/new')} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} />
          New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by booking # or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            className="input pl-9 pr-8 appearance-none"
            value={status}
            onChange={(e) => { setStatus(e.target.value as BookingStatus | ''); setPage(1); }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No bookings found</p>
          <p className="text-slate-400 text-sm mt-1">
            {status || search ? 'Try adjusting your filters' : 'Your move history will appear here'}
          </p>
          {!status && !search && (
            <button onClick={() => navigate('/bookings/new')} className="btn-primary mt-4 text-sm">
              Book Your First Move
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((booking) => (
              <div
                key={booking._id}
                className="card flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/bookings/${booking._id}`)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-slate-900 text-sm">{booking.bookingNumber}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} />
                      {booking.pickupAddress.city}, {booking.pickupAddress.province}
                      {' → '}
                      {booking.destinationAddress.city}, {booking.destinationAddress.province}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      <DateDisplay date={booking.moveDate} format="PPP" />
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {booking.aiEstimate?.estimatedPrice ? (
                      <p className="font-bold text-slate-900">${booking.aiEstimate.estimatedPrice.toLocaleString()}</p>
                    ) : (
                      <p className="text-sm text-slate-400">Price TBD</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{booking.moveSize}</p>
                  </div>
                  {/* Inline action buttons for Pending bookings */}
                  {['Pending', 'Confirmed'].includes(booking.status) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingCancel(booking); }}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 flex items-center gap-1 text-xs"
                      title="Cancel booking"
                    >
                      <XCircle size={13} /> Cancel
                    </button>
                  )}
                  {booking.status === 'Pending' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingDelete(booking); }}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 flex items-center gap-1 text-xs"
                      title="Delete booking"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">Page {page} of {pagination.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
