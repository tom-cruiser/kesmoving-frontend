import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { activityApi } from '../../services/api';
import { getActivitySocket } from '../../services/socket';
import { Activity, RefreshCw, ChevronLeft, ChevronRight, Search, Wifi, WifiOff } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDistanceToNow, format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionKey =
  | 'booking.created' | 'booking.status_changed' | 'booking.cancelled'
  | 'booking.deleted' | 'booking.crew_assigned' | 'booking.payment_updated'
  | 'estimate.reviewed'
  | 'user.login' | 'user.role_updated' | 'user.password_reset'
  | 'user.activated' | 'user.deactivated'
  | 'fleet.truck_created' | 'fleet.truck_updated' | 'fleet.truck_deleted';

interface ActivityEntry {
  _id: string;
  actorName: string;
  actorRole: string;
  action: ActionKey;
  resourceType?: string;
  resourceId?: string;
  resourceRef?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<ActionKey, { label: string; color: string; dot: string }> = {
  'booking.created':         { label: 'Created booking',        color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-500' },
  'booking.status_changed':  { label: 'Changed booking status', color: 'bg-sky-100 text-sky-700',        dot: 'bg-sky-500' },
  'booking.cancelled':       { label: 'Cancelled booking',      color: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
  'booking.deleted':         { label: 'Deleted booking',        color: 'bg-red-100 text-red-700',        dot: 'bg-red-400' },
  'booking.crew_assigned':   { label: 'Assigned crew',          color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500' },
  'booking.payment_updated': { label: 'Updated payment',        color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'estimate.reviewed':       { label: 'Reviewed estimate',      color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500' },
  'user.login':              { label: 'Logged in',              color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
  'user.role_updated':       { label: 'Updated user role',      color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  'user.password_reset':     { label: 'Reset password',         color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500' },
  'user.activated':          { label: 'Activated user',         color: 'bg-green-100 text-green-700',    dot: 'bg-green-500' },
  'user.deactivated':        { label: 'Deactivated user',       color: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
  'fleet.truck_created':     { label: 'Added truck',            color: 'bg-teal-100 text-teal-700',      dot: 'bg-teal-500' },
  'fleet.truck_updated':     { label: 'Updated truck',          color: 'bg-cyan-100 text-cyan-700',      dot: 'bg-cyan-500' },
  'fleet.truck_deleted':     { label: 'Removed truck',          color: 'bg-red-100 text-red-700',        dot: 'bg-red-400' },
};

const CATEGORY_FILTERS = [
  { value: '', label: 'All actions' },
  { value: 'booking.created', label: 'Booking created' },
  { value: 'booking.status_changed', label: 'Status changed' },
  { value: 'booking.cancelled', label: 'Cancelled' },
  { value: 'booking.crew_assigned', label: 'Crew assigned' },
  { value: 'booking.payment_updated', label: 'Payment updated' },
  { value: 'estimate.reviewed', label: 'Estimate reviewed' },
  { value: 'user.login', label: 'Login' },
  { value: 'user.role_updated', label: 'Role updated' },
  { value: 'user.password_reset', label: 'Password reset' },
  { value: 'user.activated', label: 'User activated' },
  { value: 'user.deactivated', label: 'User deactivated' },
  { value: 'fleet.truck_created', label: 'Truck added' },
  { value: 'fleet.truck_updated', label: 'Truck updated' },
  { value: 'fleet.truck_deleted', label: 'Truck deleted' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detailText(entry: ActivityEntry): string | null {
  const d = entry.details ?? {};
  switch (entry.action) {
    case 'booking.status_changed':  return d.newStatus ? `→ ${d.newStatus}` : null;
    case 'booking.cancelled':       return d.reason ? `Reason: ${d.reason}` : null;
    case 'booking.payment_updated': return d.status ? `Status: ${d.status}${d.amount ? ` · $${d.amount}` : ''}` : null;
    case 'estimate.reviewed':       return d.estimatedPrice ? `Price: $${d.estimatedPrice}${d.confirm ? ' · Confirmed' : ''}` : null;
    case 'user.role_updated':       return d.newRole ? `New role: ${d.newRole}` : null;
    default:                        return null;
  }
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ActivityRow({ entry, live = false }: { entry: ActivityEntry; live?: boolean }) {
  const cfg = ACTION_CONFIG[entry.action] ?? { label: entry.action, color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  const initials = entry.actorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const extra = detailText(entry);

  return (
    <div className={`flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0 transition-colors ${live ? 'animate-fade-in bg-primary-50/40' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0 mt-0.5">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-slate-800 text-sm">{entry.actorName}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{entry.actorRole}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
          {entry.resourceRef && (
            <span className="text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
              {entry.resourceRef}
            </span>
          )}
          {live && (
            <span className="text-xs font-medium text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded-full">live</span>
          )}
        </div>
        {extra && <p className="text-xs text-slate-500 mt-0.5">{extra}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-slate-400" title={format(new Date(entry.createdAt), 'PPpp')}>
          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
        </p>
        <p className="text-xs text-slate-300 mt-0.5">{format(new Date(entry.createdAt), 'HH:mm')}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [connected, setConnected] = useState(false);
  const [liveEntries, setLiveEntries] = useState<ActivityEntry[]>([]);
  const liveIdsRef = useRef(new Set<string>());
  const queryClient = useQueryClient();

  // ── REST load (initial + on filter change) ──
  const params: Record<string, unknown> = { page, limit: 40 };
  if (action) params.action = action;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['activity', params],
    queryFn: () => activityApi.getAll(params),
  });

  const apiEntries: ActivityEntry[] = data?.data?.data ?? [];
  const pagination = data?.data?.pagination;

  // Clear live buffer when filters or page change (API result now includes them)
  useEffect(() => {
    setLiveEntries([]);
    liveIdsRef.current.clear();
  }, [action, from, to, page]);

  // Clear live buffer when fresh API data arrives (avoids duplicates after refetch)
  useEffect(() => {
    if (apiEntries.length > 0) {
      setLiveEntries((prev) => prev.filter((e) => !apiEntries.some((a) => a._id === e._id)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ── Socket ──
  useEffect(() => {
    const socket = getActivitySocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onNew = (entry: ActivityEntry) => {
      if (liveIdsRef.current.has(entry._id)) return;
      liveIdsRef.current.add(entry._id);

      // Only prepend live entries when on page 1 with no active filters
      if (page === 1 && !action && !from && !to) {
        setLiveEntries((prev) => [entry, ...prev].slice(0, 40));
      } else {
        // Just invalidate so the badge count stays accurate
        queryClient.invalidateQueries({ queryKey: ['activity'] });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('activity:new', onNew);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('activity:new', onNew);
    };
  }, [page, action, from, to, queryClient]);

  // ── Display list (live entries on top, deduped) ──
  const apiIds = new Set(apiEntries.map((e) => e._id));
  const dedupedLive = liveEntries.filter((e) => !apiIds.has(e._id));

  const allEntries = [...dedupedLive, ...apiEntries];
  const filtered = search.trim()
    ? allEntries.filter((e) =>
        e.actorName.toLowerCase().includes(search.toLowerCase()) ||
        (e.resourceRef ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allEntries;

  const liveSet = new Set(dedupedLive.map((e) => e._id));

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    if (key === 'action') setAction(value);
    if (key === 'from') setFrom(value);
    if (key === 'to') setTo(value);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity size={22} className="text-primary-500" /> Activity Log
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Live record of all actions taken in the app</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${connected ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
            {connected
              ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><Wifi size={12} /> Live</>
              : <><WifiOff size={12} /> Offline</>
            }
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search by user or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input text-sm"
          value={action}
          onChange={(e) => handleFilterChange('action', e.target.value)}
        >
          {CATEGORY_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <input type="date" className="input text-sm" value={from} onChange={(e) => handleFilterChange('from', e.target.value)} title="From date" />
        <input type="date" className="input text-sm" value={to}   onChange={(e) => handleFilterChange('to', e.target.value)}   title="To date" />
        {(action || from || to || search) && (
          <button className="btn-secondary text-sm" onClick={() => { setAction(''); setFrom(''); setTo(''); setSearch(''); setPage(1); }}>
            Clear
          </button>
        )}
      </div>

      {/* Feed */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Activity size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400">No activity found</p>
          </div>
        ) : (
          <div className="px-4">
            {filtered.map((entry) => (
              <ActivityRow key={entry._id} entry={entry} live={liveSet.has(entry._id)} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{pagination.total} total events</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            <span>Page {page} of {pagination.pages}</span>
            <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
