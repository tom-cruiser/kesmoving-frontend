import { useState } from 'react';
import { useBookings, useUpdateBookingStatus, useAssignCrew, useCancelBooking, useUpdateBooking, useDeleteBooking } from '../../hooks/useBookings';
import { useFleet } from '../../hooks/useFleet';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import DateDisplay from '../../components/common/DateDisplay';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Search, Filter, X, Loader2, Users, MapPin, Trash2, Pencil, XCircle } from 'lucide-react';
import type { Booking, BookingStatus, User } from '../../types';
import toast from 'react-hot-toast';

const STATUSES: BookingStatus[] = ['Pending','Confirmed','Scheduled','InProgress','Completed','Cancelled'];

interface AssignCrewModal {
  booking: Booking;
}

function AssignCrewModal({ booking, onClose }: AssignCrewModal & { onClose: () => void }) {
  const { data: fleetData } = useFleet();
  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => userApi.getAll({ role: 'Driver' }),
  });
  const assignCrew = useAssignCrew();

  const [truckId, setTruckId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(booking.moveDate ? new Date(booking.moveDate).toISOString().slice(0, 16) : '');

  const trucks = fleetData?.data?.filter((t) => t.status === 'Available') || [];
  const drivers: User[] = staffData?.data?.data || [];

  const handleAssign = async () => {
    if (!truckId) { toast.error('Select a truck'); return; }
    try {
      await assignCrew.mutateAsync({ bookingId: booking._id, crewData: { truck: truckId, driver: driverId || undefined, scheduledDate } });
      toast.success('Crew assigned successfully');
      onClose();
    } catch {
      toast.error('Failed to assign crew');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Assign Crew</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 text-sm">
            <p className="font-medium text-slate-800">{booking.bookingNumber}</p>
            <p className="text-slate-500">{booking.pickupAddress.city} → {booking.destinationAddress.city}</p>
          </div>
          <div>
            <label className="label">Scheduled Date</label>
            <input type="datetime-local" className="input" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Truck *</label>
            <select className="input" value={truckId} onChange={(e) => setTruckId(e.target.value)}>
              <option value="">Select a truck...</option>
              {trucks.map((t) => <option key={t._id} value={t._id}>{t.licensePlate} — {t.capacity.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Driver</label>
            <select className="input" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Select a driver...</option>
              {drivers.map((d) => <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>)}
            </select>
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleAssign} disabled={assignCrew.isPending} className="btn-primary text-sm flex items-center gap-1.5">
            {assignCrew.isPending ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Edit Modal ─────────────────────────────────────────────────────────
function AdminEditModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
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
    try {
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
    } catch {
      // toast handled in hook
    }
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
            <Pencil size={16} className="text-primary-500" /> Edit — {booking.bookingNumber}
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
          <button onClick={handleSave} disabled={update.isPending} className="btn-primary text-sm flex items-center gap-1.5">
            {update.isPending ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Cancel Modal ────────────────────────────────────────────────────────
function AdminCancelModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const cancel = useCancelBooking();
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    try {
      await cancel.mutateAsync({ bookingId: booking._id, cancellationReason: reason });
      onClose();
    } catch {
      // toast handled in hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <XCircle size={18} className="text-red-500" /> Cancel — {booking.bookingNumber}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-slate-600">Mark this booking as cancelled?</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
            <textarea
              className="input w-full resize-none"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Keep</button>
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

// ─── Admin Delete Modal ────────────────────────────────────────────────────────
function AdminDeleteModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const del = useDeleteBooking();

  const handleDelete = async () => {
    try {
      await del.mutateAsync(booking._id);
      onClose();
    } catch {
      // toast handled in hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Trash2 size={18} className="text-red-500" /> Delete — {booking.bookingNumber}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600">Permanently delete this booking? This cannot be undone.</p>
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

export default function BookingsManagementPage() {
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [deleteBooking, setDeleteBooking] = useState<Booking | null>(null);
  const updateStatus = useUpdateBookingStatus();

  const { data, isLoading } = useBookings({ status: status || undefined, page, limit: 15 });
  const bookings: Booking[] = data?.data || [];
  const pagination = data?.pagination;

  const filtered = search.trim()
    ? bookings.filter((b) =>
        b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.pickupAddress.city.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await updateStatus.mutateAsync({ bookingId, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {selectedBooking && (
        <AssignCrewModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
      {editBooking && (
        <AdminEditModal booking={editBooking} onClose={() => setEditBooking(null)} />
      )}
      {cancelBooking && (
        <AdminCancelModal booking={cancelBooking} onClose={() => setCancelBooking(null)} />
      )}
      {deleteBooking && (
        <AdminDeleteModal booking={deleteBooking} onClose={() => setDeleteBooking(null)} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search booking # or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select className="input pl-9" value={status} onChange={(e) => { setStatus(e.target.value as BookingStatus | ''); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['Booking #','Route','Move Date','Size','Status','Load Time','Est. Price','Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400">No bookings found</td></tr>
                ) : filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{b.bookingNumber}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin size={11} className="text-slate-400" />
                        {b.pickupAddress.city} → {b.destinationAddress.city}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600"><DateDisplay date={b.moveDate} /></td>
                    <td className="px-4 py-3 text-slate-600">{b.moveSize}</td>
                    <td className="px-4 py-3">
                      <div className="relative group inline-block">
                        <StatusBadge status={b.status} />
                        <select
                          className="absolute inset-0 opacity-0 w-full cursor-pointer"
                          value={b.status}
                          onChange={(e) => handleStatusUpdate(b._id, e.target.value as BookingStatus)}
                        >
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.aiEstimate?.loadingTime != null
                        ? `${b.aiEstimate.loadingTime} h`
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.aiEstimate?.estimatedPrice != null
                        ? <span className="font-medium text-emerald-600">${b.aiEstimate.estimatedPrice.toLocaleString()}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="btn-secondary text-xs flex items-center gap-1"
                        >
                          <Users size={12} />
                          Crew
                        </button>
                        <button
                          onClick={() => setEditBooking(b)}
                          className="btn-secondary text-xs flex items-center gap-1"
                          title="Edit booking"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <button
                            onClick={() => setCancelBooking(b)}
                            className="border border-amber-200 text-amber-600 hover:bg-amber-50 text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                            title="Cancel booking"
                          >
                            <XCircle size={12} />
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteBooking(b)}
                          className="border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                          title="Delete booking"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-slate-600">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
