import { cn } from '@/lib/utils';

const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border' },
  2: { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border' },
  3: { bg: 'bg-secondary', text: 'text-foreground', border: 'border-border' },
  4: { bg: 'bg-secondary', text: 'text-foreground', border: 'border-border' },
  5: { bg: 'bg-accent', text: 'text-foreground', border: 'border-border' },
  6: { bg: 'bg-accent', text: 'text-foreground', border: 'border-border' },
  7: { bg: 'bg-accent', text: 'text-foreground', border: 'border-primary/30' },
  8: { bg: 'bg-accent', text: 'text-primary', border: 'border-primary/50' },
  9: { bg: 'bg-primary', text: 'text-primary-foreground', border: 'border-primary' },
};

const LEVEL_ICONS: Record<number, string> = {
  1: '🌱',
  2: '🌿',
  3: '⭐',
  4: '💫',
  5: '🔥',
  6: '💎',
  7: '👑',
  8: '🏆',
  9: '🚀',
};

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function LevelBadge({
  level,
  size = 'sm',
  showIcon = true,
  className,
}: LevelBadgeProps) {
  const safeLevel = Math.min(9, Math.max(1, level));
  const colors = LEVEL_COLORS[safeLevel];
  const icon = LEVEL_ICONS[safeLevel];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border font-medium',
        colors.bg,
        colors.text,
        colors.border,
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-0.5 text-xs',
        size === 'lg' && 'px-2.5 py-1 text-sm',
        className
      )}
    >
      {showIcon && <span className={cn(
        size === 'sm' && 'text-[10px]',
        size === 'md' && 'text-xs',
        size === 'lg' && 'text-sm',
      )}>{icon}</span>}
      Lv.{safeLevel}
    </span>
  );
}
