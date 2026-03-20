import { useNavigate } from 'react-router-dom';
import { Calendar, Truck, Star, MessageCircle, ArrowRight, Package } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useBookings } from '../../hooks/useBookings';
import StatusBadge from '../../components/common/StatusBadge';
import DateDisplay from '../../components/common/DateDisplay';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { Booking } from '../../types';

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data, isLoading } = useBookings({ limit: 5 });

  const bookings: Booking[] = data?.data || [];
  const activeBooking = bookings.find((b) => ['Scheduled', 'InProgress', 'Confirmed'].includes(b.status));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}! 👋</h1>
        <p className="text-primary-100 mt-1">
          {activeBooking
            ? `You have an active move on ${new Date(activeBooking.moveDate).toLocaleDateString('en-CA')}`
            : 'Ready to plan your next move?'}
        </p>
        {!activeBooking && (
          <button
            onClick={() => navigate('/bookings/new')}
            className="mt-4 bg-white text-primary-700 font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-primary-50 transition-colors"
          >
            <Calendar size={16} />
            Book a Move
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: 'Book a Move', action: () => navigate('/bookings/new'), color: 'bg-blue-50 text-blue-600' },
          { icon: Truck, label: 'Track Truck', action: () => activeBooking ? navigate(`/tracking/${activeBooking._id}`) : null, color: 'bg-green-50 text-green-600' },
          { icon: MessageCircle, label: 'Get Support', action: () => navigate('/chat'), color: 'bg-purple-50 text-purple-600' },
          { icon: Package, label: 'My Bookings', action: () => navigate('/bookings'), color: 'bg-amber-50 text-amber-600' },
        ].map(({ icon: Icon, label, action, color }) => (
          <button
            key={label}
            onClick={action}
            className="card flex flex-col items-center gap-3 py-5 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon size={24} />
            </div>
            <span className="text-sm font-medium text-slate-700">{label}</span>
          </button>
        ))}
      </div>

      {/* Active Booking */}
      {activeBooking && (
        <div className="card border-l-4 border-l-primary-500">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-900">Active Booking</h3>
              <p className="text-sm text-slate-500">{activeBooking.bookingNumber}</p>
            </div>
            <StatusBadge status={activeBooking.status} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
            <span>📍 {activeBooking.pickupAddress.city} → {activeBooking.destinationAddress.city}</span>
            <span>📅 <DateDisplay date={activeBooking.moveDate} /></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/bookings/${activeBooking._id}`)}
              className="btn-secondary text-sm flex-1"
            >
              View Details
            </button>
            {activeBooking.status === 'InProgress' && (
              <button
                onClick={() => navigate(`/tracking/${activeBooking._id}`)}
                className="btn-primary text-sm flex-1 flex items-center justify-center gap-1.5"
              >
                <Truck size={14} />
                Track Live
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Bookings</h2>
          <button onClick={() => navigate('/bookings')} className="text-sm text-primary-600 hover:underline">
            View all
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : bookings.length === 0 ? (
          <div className="card text-center py-10">
            <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No bookings yet</p>
            <p className="text-slate-400 text-sm mt-1">Book your first move to get started</p>
            <button onClick={() => navigate('/bookings/new')} className="btn-primary mt-4 text-sm">
              Book a Move
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 4).map((booking) => (
              <div
                key={booking._id}
                onClick={() => navigate(`/bookings/${booking._id}`)}
                className="card flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Truck size={20} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{booking.bookingNumber}</p>
                  <p className="text-slate-500 text-xs truncate">
                    {booking.pickupAddress.city} → {booking.destinationAddress.city}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={booking.status} />
                  <p className="text-xs text-slate-400 mt-1"><DateDisplay date={booking.moveDate} /></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
