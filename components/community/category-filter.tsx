'use client';

import { t } from '@/lib/i18n/ka';
import type { Category } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function CategoryFilter({
  categories,
  selectedId,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
          selectedId === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-muted-foreground hover:bg-accent'
        )}
      >
        {t('community.allCategories')}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            selectedId === cat.id
              ? 'text-white'
              : 'bg-secondary text-muted-foreground hover:bg-accent'
          )}
          style={
            selectedId === cat.id ? { backgroundColor: cat.color } : undefined
          }
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
