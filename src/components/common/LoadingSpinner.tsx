import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ size = 24, className = '', fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }
  return <Loader2 size={size} className={`animate-spin text-primary-600 ${className}`} />;
}
