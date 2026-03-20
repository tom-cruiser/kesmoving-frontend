import { useAnalyticsOverview, useBookingTrend, useStaffPerformance } from '../../hooks/useAnalytics';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, Calendar, Star, Users, Truck, Clock } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PIE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#64748b'];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}><Icon size={20} /></div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: overviewData, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: trendData } = useBookingTrend({ period: 'monthly' });
  const { data: staffData } = useStaffPerformance();

  const overview = overviewData?.data;
  const trend = trendData?.data || [];
  const staff = (staffData?.data || []).map((s: any) => ({
    ...s,
    name: s.name || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || 'Unknown',
  }));

  const statusBreakdown = overview?.statusBreakdown ?? {};
  const statusDistribution = Object.entries(statusBreakdown)
    .filter(([, v]) => (v as number) > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm">Business performance overview</p>
      </div>

      {/* KPI Row */}
      {overviewLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={`$${(overview?.totalRevenue ?? 0).toLocaleString()}`} icon={DollarSign} color="bg-green-50 text-green-600" />
          <StatCard label="Total Bookings" value={overview?.totalBookings ?? 0} icon={Calendar} color="bg-blue-50 text-blue-600" />
          <StatCard label="Avg Rating" value={overview?.avgRating ? `${overview.avgRating.toFixed(1)} ★` : 'N/A'} icon={Star} color="bg-amber-50 text-amber-600" />
          <StatCard label="Completed Moves" value={overview?.completedBookings ?? 0} icon={TrendingUp} color="bg-primary-50 text-primary-600" />
        </div>
      )}

      {/* Secondary KPI Row */}
      {!overviewLoading && overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Clients" value={overview.totalClients ?? 0} icon={Users} color="bg-purple-50 text-purple-600" />
          <StatCard label="Staff Members" value={overview.totalStaff ?? 0} icon={Users} color="bg-slate-100 text-slate-600" />
          <StatCard label="Trucks Available" value={overview.fleet?.available ?? 0} icon={Truck} color="bg-cyan-50 text-cyan-600" />
          <StatCard label="Trucks In Use" value={overview.fleet?.inUse ?? 0} icon={Clock} color="bg-orange-50 text-orange-600" />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Booking Trend */}
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-slate-900 mb-4">Booking Trend (Monthly)</h2>
          {trend.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No trend data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} name="Bookings" />
                <Line yAxisId="right" type="monotone" dataKey="avgLoadingTime" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Avg Load Time (h)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Distribution Pie */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Status Distribution</h2>
          {statusDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {statusDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusDistribution.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-600 flex-1">{item.name}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Staff Performance Bar Chart */}
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-4">Staff Performance</h2>
        {staff.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No performance data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={staff} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0' }} />
              <Legend />
              <Bar dataKey="completedMoves" fill="#2563eb" name="Completed Moves" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
