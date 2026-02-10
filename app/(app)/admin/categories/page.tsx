'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './actions';
import type { Category } from '@/lib/db/schema';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState('#6B7280');
  const [formSort, setFormSort] = useState(0);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const data = await getCategories();
    setCats(data);
  }

  function resetForm() {
    setFormName('');
    setFormDesc('');
    setFormColor('#6B7280');
    setFormSort(0);
    setEditingId(null);
    setShowNew(false);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormDesc(cat.description ?? '');
    setFormColor(cat.color);
    setFormSort(cat.sortOrder);
    setShowNew(false);
  }

  function startNew() {
    resetForm();
    setShowNew(true);
  }

  async function handleSave() {
    startTransition(async () => {
      if (editingId) {
        await updateCategory({
          id: editingId,
          name: formName,
          description: formDesc || undefined,
          color: formColor,
          sortOrder: formSort,
        });
      } else {
        await createCategory({
          name: formName,
          description: formDesc || undefined,
          color: formColor,
          sortOrder: formSort,
        });
      }
      resetForm();
      await loadCategories();
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    startTransition(async () => {
      await deleteCategory(id);
      await loadCategories();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t('admin.categories')}
          </h1>
        </div>
        <Button onClick={startNew} size="sm">
          <Plus className="h-4 w-4" />
          {t('common.create')}
        </Button>
      </div>

      {/* New/Edit Form */}
      {(showNew || editingId !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? t('common.edit') : t('common.create')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Short description"
                />
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border"
                    />
                    <Input
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-28"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Sort Order</label>
                  <Input
                    type="number"
                    value={formSort}
                    onChange={(e) => setFormSort(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isPending || !formName}>
                  {isPending ? t('common.loading') : t('common.save')}
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {cats.map((cat) => (
          <Card key={cat.id} className="py-3">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <span className="font-medium">{cat.name}</span>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">#{cat.sortOrder}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEdit(cat)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {cats.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No categories yet.
          </p>
        )}
      </div>
    </div>
  );
}
