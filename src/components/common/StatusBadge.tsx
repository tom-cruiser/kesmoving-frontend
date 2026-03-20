import type { BookingStatus } from '../../types';

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  Pending: { label: 'Pending', className: 'badge-pending' },
  Confirmed: { label: 'Confirmed', className: 'badge-confirmed' },
  Scheduled: { label: 'Scheduled', className: 'badge-scheduled' },
  InProgress: { label: 'In Progress', className: 'badge-inprogress' },
  Completed: { label: 'Completed', className: 'badge-completed' },
  Cancelled: { label: 'Cancelled', className: 'badge-cancelled' },
};

interface StatusBadgeProps {
  status: BookingStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'badge bg-slate-100 text-slate-700' };
  return <span className={config.className}>{config.label}</span>;
}
