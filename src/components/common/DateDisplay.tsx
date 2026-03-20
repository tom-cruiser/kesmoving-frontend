import { format, formatDistanceToNow } from 'date-fns';

interface Props {
  date: string | Date | null | undefined;
  relative?: boolean;
  showTime?: boolean;
  format?: string;
}

export default function DateDisplay({ date, relative = false, showTime = false, format: fmt }: Props) {
  if (!date) return <span>—</span>;
  const d = new Date(date);
  if (isNaN(d.getTime())) return <span>—</span>;
  if (relative) {
    return <span title={format(d, 'PPP')}>{formatDistanceToNow(d, { addSuffix: true })}</span>;
  }
  const formatStr = fmt ?? (showTime ? 'PPp' : 'PP');
  return <span>{format(d, formatStr)}</span>;
}
