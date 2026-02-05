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
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
