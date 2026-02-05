import { cn } from '@/lib/utils';

const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  2: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  3: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  4: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  5: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  6: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  7: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  8: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  9: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
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
