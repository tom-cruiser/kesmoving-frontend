import { useNavigate } from 'react-router-dom';
import { useAnalyticsOverview } from '../../hooks/useAnalytics';
import { useBookings } from '../../hooks/useBookings';
import { useFleet } from '../../hooks/useFleet';
import { TrendingUp, Users, Truck, Calendar, DollarSign, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import DateDisplay from '../../components/common/DateDisplay';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview();
  const { data: bookingsData } = useBookings({ limit: 8, status: undefined });
  const { data: fleetData } = useFleet();

  const overview = analytics?.data;
  const bookings = bookingsData?.data || [];
  const trucks = fleetData?.data || [];

  const availableTrucks = trucks.filter((t) => t.status === 'Available').length;
  const activeTrucks = trucks.filter((t) => t.status === 'InUse').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Operations Dashboard</h1>
        <p className="text-slate-500 text-sm">Overview of all moving operations</p>
      </div>

      {/* KPI Cards */}
      {analyticsLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Bookings" value={overview?.totalBookings ?? 0} icon={Calendar} color="bg-blue-50 text-blue-600" />
          <StatCard label="Revenue (Month)" value={`$${(overview?.monthlyRevenue ?? 0).toLocaleString()}`} icon={DollarSign} color="bg-green-50 text-green-600" />
          <StatCard label="Active Moves" value={overview?.activeBookings ?? 0} sub="In progress today" icon={Truck} color="bg-amber-50 text-amber-600" />
          <StatCard label="Pending Review" value={overview?.pendingReview ?? 0} sub="Needs attention" icon={Clock} color="bg-red-50 text-red-600" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Bookings</h2>
            <button onClick={() => navigate('/admin/bookings')} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </button>
          </div>
          {bookings.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b._id} onClick={() => navigate(`/admin/bookings`)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{b.bookingNumber}</p>
                    <p className="text-xs text-slate-500 truncate">{b.pickupAddress.city} → {b.destinationAddress.city}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={b.status} />
                    <p className="text-xs text-slate-400 mt-0.5"><DateDisplay date={b.moveDate} /></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fleet Summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Fleet Status</h2>
            <button onClick={() => navigate('/admin/fleet')} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Manage <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Available', count: availableTrucks, color: 'bg-green-500' },
              { label: 'In Use', count: activeTrucks, color: 'bg-blue-500' },
              { label: 'In Maintenance', count: trucks.filter((t) => t.status === 'Maintenance').length, color: 'bg-amber-500' },
              { label: 'Out of Service', count: trucks.filter((t) => t.status === 'OutOfService').length, color: 'bg-red-500' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-sm text-slate-600 flex-1">{label}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex items-center gap-2 text-sm text-slate-500">
              <Truck size={14} />
              <span>Total: {trucks.length} truck{trucks.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <button onClick={() => navigate('/admin/tracking')} className="w-full btn-secondary text-sm mt-4 flex items-center justify-center gap-1.5">
            <Truck size={14} />
            Live Tracking Map
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'AI Estimates Queue', path: '/admin/estimates', color: 'bg-purple-50 text-purple-700', count: overview?.pendingReview },
          { label: 'Escalated Chats', path: '/admin/chat', color: 'bg-red-50 text-red-700', count: overview?.escalatedChats },
          { label: 'Staff Management', path: '/admin/staff', color: 'bg-blue-50 text-blue-700' },
          { label: 'Analytics Report', path: '/admin/analytics', color: 'bg-green-50 text-green-700' },
        ].map(({ label, path, color, count }) => (
          <button key={path} onClick={() => navigate(path)} className={`card text-left hover:shadow-md transition-all ${color} border-0`}>
            <p className="font-semibold text-sm">{label}</p>
            {count !== undefined && count > 0 && (
              <p className="text-2xl font-bold mt-1">{count}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
