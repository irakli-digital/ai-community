'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n/ka';
import {
  getAdminCourse,
  updateCourse,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderSections,
  reorderLessons,
  publishCourse,
  unpublishCourse,
} from '../actions';
import type {
  Course,
  CourseSection,
  Lesson,
  LessonAttachment,
} from '@/lib/db/schema';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  Video,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

type SectionWithLessons = CourseSection & {
  lessons: (Lesson & { attachments: LessonAttachment[] })[];
};

export default function EditCoursePage() {
  const params = useParams();
  const courseId = Number(params.courseId);
  const [isPending, startTransition] = useTransition();

  // Course data
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<SectionWithLessons[]>([]);

  // Course edit form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  // Section form
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');

  // Lesson form
  const [addingLessonToSection, setAddingLessonToSection] = useState<
    number | null
  >(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState(0);
  const [lessonSortOrder, setLessonSortOrder] = useState(0);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );

  const loadData = useCallback(async () => {
    const data = await getAdminCourse(courseId);
    if (!data) return;
    setCourse(data.course);
    setSections(data.sections);
    setTitle(data.course.title);
    setDescription(data.course.description ?? '');
    setThumbnailUrl(data.course.thumbnailUrl ?? '');
    setIsPaid(data.course.isPaid);
    setSortOrder(data.course.sortOrder);
    // Expand all sections by default
    setExpandedSections(new Set(data.sections.map((s) => s.id)));
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleSection(sectionId: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  // ─── Course Save ────────────────────────────────────────────────────

  async function handleSaveCourse() {
    startTransition(async () => {
      await updateCourse({
        id: courseId,
        title,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        isPaid,
        sortOrder,
      });
      await loadData();
    });
  }

  async function handleTogglePublish() {
    if (!course) return;
    startTransition(async () => {
      if (course.isPublished) {
        await unpublishCourse(courseId);
      } else {
        await publishCourse(courseId);
      }
      await loadData();
    });
  }

  // ─── Section handlers ──────────────────────────────────────────────

  async function handleCreateSection() {
    if (!newSectionTitle.trim()) return;
    startTransition(async () => {
      await createSection({
        courseId,
        title: newSectionTitle,
        sortOrder: sections.length,
      });
      setNewSectionTitle('');
      setShowNewSection(false);
      await loadData();
    });
  }

  async function handleUpdateSection(id: number) {
    if (!editSectionTitle.trim()) return;
    startTransition(async () => {
      await updateSection({ id, title: editSectionTitle });
      setEditingSectionId(null);
      await loadData();
    });
  }

  async function handleDeleteSection(id: number) {
    if (!confirm('ნამდვილად გსურთ სექციის წაშლა? ყველა გაკვეთილი წაიშლება.'))
      return;
    startTransition(async () => {
      await deleteSection(id);
      await loadData();
    });
  }

  function handleMoveSectionUp(idx: number) {
    if (idx === 0) return;
    const reordered = sections.map((s, i) => ({
      id: s.id,
      sortOrder: i === idx ? idx - 1 : i === idx - 1 ? idx : i,
    }));
    startTransition(async () => {
      await reorderSections(reordered);
      await loadData();
    });
  }

  function handleMoveSectionDown(idx: number) {
    if (idx === sections.length - 1) return;
    const reordered = sections.map((s, i) => ({
      id: s.id,
      sortOrder: i === idx ? idx + 1 : i === idx + 1 ? idx : i,
    }));
    startTransition(async () => {
      await reorderSections(reordered);
      await loadData();
    });
  }

  // ─── Lesson handlers ──────────────────────────────────────────────

  function resetLessonForm() {
    setLessonTitle('');
    setLessonDesc('');
    setLessonVideoUrl('');
    setLessonContent('');
    setLessonDuration(0);
    setLessonSortOrder(0);
    setAddingLessonToSection(null);
    setEditingLessonId(null);
  }

  function startEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setAddingLessonToSection(null);
    setLessonTitle(lesson.title);
    setLessonDesc(lesson.description ?? '');
    setLessonVideoUrl(lesson.videoUrl ?? '');
    setLessonContent(lesson.content ?? '');
    setLessonDuration(lesson.durationSeconds ?? 0);
    setLessonSortOrder(lesson.sortOrder);
  }

  function startAddLesson(sectionId: number, lessonCount: number) {
    setAddingLessonToSection(sectionId);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDesc('');
    setLessonVideoUrl('');
    setLessonContent('');
    setLessonDuration(0);
    setLessonSortOrder(lessonCount);
  }

  async function handleSaveLesson(sectionId: number) {
    if (!lessonTitle.trim()) return;
    startTransition(async () => {
      if (editingLessonId) {
        await updateLesson({
          id: editingLessonId,
          title: lessonTitle,
          description: lessonDesc || undefined,
          videoUrl: lessonVideoUrl || undefined,
          content: lessonContent || undefined,
          durationSeconds: lessonDuration || undefined,
          sortOrder: lessonSortOrder,
        });
      } else {
        await createLesson({
          sectionId,
          courseId,
          title: lessonTitle,
          description: lessonDesc || undefined,
          videoUrl: lessonVideoUrl || undefined,
          content: lessonContent || undefined,
          durationSeconds: lessonDuration || undefined,
          sortOrder: lessonSortOrder,
        });
      }
      resetLessonForm();
      await loadData();
    });
  }

  async function handleDeleteLesson(lessonId: number) {
    if (!confirm('ნამდვილად გსურთ გაკვეთილის წაშლა?')) return;
    startTransition(async () => {
      await deleteLesson(lessonId);
      await loadData();
    });
  }

  if (!course) {
    return (
      <div className="py-8 text-center text-gray-500">{t('common.loading')}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            კურსის რედაქტირება
          </h1>
        </div>
        <Button
          onClick={handleTogglePublish}
          disabled={isPending}
          variant={course.isPublished ? 'ghost' : 'default'}
          size="sm"
        >
          {course.isPublished ? (
            <>
              <EyeOff className="mr-1 h-4 w-4" />
              დამალვა
            </>
          ) : (
            <>
              <Eye className="mr-1 h-4 w-4" />
              გამოქვეყნება
            </>
          )}
        </Button>
      </div>

      {/* Course Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>კურსის ინფორმაცია</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">სათაური *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="კურსის სათაური"
            />
          </div>
          <div>
            <label className="text-sm font-medium">აღწერა</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="კურსის აღწერა..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium">თამბნეილის URL</label>
            <Input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPaid"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="isPaid" className="text-sm font-medium">
                ფასიანი კურსი
              </label>
            </div>
            <div>
              <label className="text-sm font-medium">თანმიმდევრობა</label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
          <Button onClick={handleSaveCourse} disabled={isPending || !title}>
            <Save className="mr-1 h-4 w-4" />
            {isPending ? t('common.loading') : t('common.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Sections & Lessons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            სექციები და გაკვეთილები
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNewSection(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            სექციის დამატება
          </Button>
        </div>

        {/* New Section Form */}
        {showNewSection && (
          <Card className="border-dashed border-orange-300">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <Input
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="სექციის სახელი"
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSection();
                    if (e.key === 'Escape') {
                      setShowNewSection(false);
                      setNewSectionTitle('');
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCreateSection}
                  disabled={isPending || !newSectionTitle.trim()}
                >
                  {t('common.save')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowNewSection(false);
                    setNewSectionTitle('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section List */}
        {sections.map((section, sIdx) => (
          <Card key={section.id}>
            <CardContent className="py-3">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleMoveSectionUp(sIdx)}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      disabled={sIdx === 0 || isPending}
                    >
                      <GripVertical className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMoveSectionDown(sIdx)}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      disabled={sIdx === sections.length - 1 || isPending}
                    >
                      <GripVertical className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center gap-1 text-gray-700"
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {editingSectionId === section.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editSectionTitle}
                        onChange={(e) => setEditSectionTitle(e.target.value)}
                        className="w-64"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            handleUpdateSection(section.id);
                          if (e.key === 'Escape') setEditingSectionId(null);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateSection(section.id)}
                        disabled={isPending}
                      >
                        {t('common.save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingSectionId(null)}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium">
                      {section.title}{' '}
                      <span className="text-xs text-gray-400">
                        ({section.lessons.length} გაკვეთილი)
                      </span>
                    </span>
                  )}
                </div>

                {editingSectionId !== section.id && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingSectionId(section.id);
                        setEditSectionTitle(section.title);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Lessons list (expanded) */}
              {expandedSections.has(section.id) && (
                <div className="ml-10 mt-3 space-y-2">
                  {section.lessons.map((lesson) => (
                    <div key={lesson.id}>
                      {editingLessonId === lesson.id ? (
                        <LessonForm
                          lessonTitle={lessonTitle}
                          setLessonTitle={setLessonTitle}
                          lessonDesc={lessonDesc}
                          setLessonDesc={setLessonDesc}
                          lessonVideoUrl={lessonVideoUrl}
                          setLessonVideoUrl={setLessonVideoUrl}
                          lessonContent={lessonContent}
                          setLessonContent={setLessonContent}
                          lessonDuration={lessonDuration}
                          setLessonDuration={setLessonDuration}
                          lessonSortOrder={lessonSortOrder}
                          setLessonSortOrder={setLessonSortOrder}
                          onSave={() => handleSaveLesson(section.id)}
                          onCancel={resetLessonForm}
                          isPending={isPending}
                          isEditing
                        />
                      ) : (
                        <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            {lesson.videoUrl ? (
                              <Video className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">{lesson.title}</span>
                            {lesson.durationSeconds && (
                              <span className="text-xs text-gray-400">
                                {Math.floor(lesson.durationSeconds / 60)} წთ
                              </span>
                            )}
                            {lesson.attachments.length > 0 && (
                              <span className="text-xs text-gray-400">
                                📎 {lesson.attachments.length}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditLesson(lesson)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Lesson button / form */}
                  {addingLessonToSection === section.id ? (
                    <LessonForm
                      lessonTitle={lessonTitle}
                      setLessonTitle={setLessonTitle}
                      lessonDesc={lessonDesc}
                      setLessonDesc={setLessonDesc}
                      lessonVideoUrl={lessonVideoUrl}
                      setLessonVideoUrl={setLessonVideoUrl}
                      lessonContent={lessonContent}
                      setLessonContent={setLessonContent}
                      lessonDuration={lessonDuration}
                      setLessonDuration={setLessonDuration}
                      lessonSortOrder={lessonSortOrder}
                      setLessonSortOrder={setLessonSortOrder}
                      onSave={() => handleSaveLesson(section.id)}
                      onCancel={resetLessonForm}
                      isPending={isPending}
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-orange-600"
                      onClick={() =>
                        startAddLesson(section.id, section.lessons.length)
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      გაკვეთილის დამატება
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {sections.length === 0 && !showNewSection && (
          <p className="py-4 text-center text-sm text-gray-500">
            სექციები ჯერ არ არის. დაამატეთ პირველი სექცია.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Lesson Form Component ────────────────────────────────────────────────

function LessonForm({
  lessonTitle,
  setLessonTitle,
  lessonDesc,
  setLessonDesc,
  lessonVideoUrl,
  setLessonVideoUrl,
  lessonContent,
  setLessonContent,
  lessonDuration,
  setLessonDuration,
  lessonSortOrder,
  setLessonSortOrder,
  onSave,
  onCancel,
  isPending,
  isEditing = false,
}: {
  lessonTitle: string;
  setLessonTitle: (v: string) => void;
  lessonDesc: string;
  setLessonDesc: (v: string) => void;
  lessonVideoUrl: string;
  setLessonVideoUrl: (v: string) => void;
  lessonContent: string;
  setLessonContent: (v: string) => void;
  lessonDuration: number;
  setLessonDuration: (v: number) => void;
  lessonSortOrder: number;
  setLessonSortOrder: (v: number) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  isEditing?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-md border border-dashed border-orange-300 bg-orange-50/30 p-3">
      <div>
        <label className="text-xs font-medium">სათაური *</label>
        <Input
          value={lessonTitle}
          onChange={(e) => setLessonTitle(e.target.value)}
          placeholder="გაკვეთილის სათაური"
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs font-medium">აღწერა</label>
        <textarea
          value={lessonDesc}
          onChange={(e) => setLessonDesc(e.target.value)}
          placeholder="მოკლე აღწერა..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          rows={2}
        />
      </div>
      <div>
        <label className="text-xs font-medium">ვიდეოს URL (YouTube / Vimeo)</label>
        <Input
          value={lessonVideoUrl}
          onChange={(e) => setLessonVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>
      <div>
        <label className="text-xs font-medium">კონტენტი (Markdown)</label>
        <textarea
          value={lessonContent}
          onChange={(e) => setLessonContent(e.target.value)}
          placeholder="გაკვეთილის შინაარსი Markdown ფორმატში..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          rows={4}
        />
      </div>
      <div className="flex gap-3">
        <div>
          <label className="text-xs font-medium">ხანგრძლივობა (წამ)</label>
          <Input
            type="number"
            value={lessonDuration}
            onChange={(e) => setLessonDuration(Number(e.target.value))}
            className="w-28"
          />
        </div>
        <div>
          <label className="text-xs font-medium">თანმიმდევრობა</label>
          <Input
            type="number"
            value={lessonSortOrder}
            onChange={(e) => setLessonSortOrder(Number(e.target.value))}
            className="w-20"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSave}
          disabled={isPending || !lessonTitle.trim()}
        >
          {isPending ? t('common.loading') : isEditing ? t('common.save') : t('common.create')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
