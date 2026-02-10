import { cn } from '@/lib/utils';

interface CrosshairProps {
  className?: string;
}

export function Crosshair({ className }: CrosshairProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={cn('text-border', className)}
    >
      <path
        d="M12 0v24M0 12h24"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

interface CrosshairMarkProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function CrosshairMark({ className, position = 'top-left' }: CrosshairMarkProps) {
  const positionClasses = {
    'top-left': '-top-3 -left-3',
    'top-right': '-top-3 -right-3',
    'bottom-left': '-bottom-3 -left-3',
    'bottom-right': '-bottom-3 -right-3',
  };

  return (
    <div className={cn('absolute', positionClasses[position], className)}>
      <Crosshair />
    </div>
  );
}
