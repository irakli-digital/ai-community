'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LevelBadge } from '@/components/members/level-badge';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchTab = 'posts' | 'courses' | 'members';

const tabs: { key: SearchTab; label: string }[] = [
  { key: 'posts', label: 'Posts' },
  { key: 'courses', label: 'Courses' },
  { key: 'members', label: 'Members' },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('posts');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setTotal(0);
    }
  }, [isOpen]);

  const search = useCallback(
    async (q: string, tab: SearchTab) => {
      if (!q.trim()) {
        setResults([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&tab=${tab}&limit=8`
        );
        const data = await res.json();
        setResults(data.results || []);
        setTotal(data.total || 0);
      } catch {
        setResults([]);
        setTotal(0);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(query, activeTab);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeTab, search]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleGoToSearch() {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}&tab=${activeTab}`);
      onClose();
    }
  }

  function handleItemClick() {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-auto mt-[10vh] w-full max-w-xl px-4">
        <div className="rounded-lg border border-border bg-card shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGoToSearch();
              }}
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <button onClick={onClose}>
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
            {query && !loading && results.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found
              </p>
            )}

            {!query && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Enter a search term
              </p>
            )}

            {/* Post results */}
            {activeTab === 'posts' &&
              results.map((post: any) => (
                <Link
                  key={post.id}
                  href={post.slug && post.categorySlug ? `/community-post/${post.categorySlug}/${post.slug}` : `/community/${post.id}`}
                  onClick={handleItemClick}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                    <AvatarImage src={post.authorAvatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {post.authorName?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {post.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {post.content?.slice(0, 100)}
                    </p>
                  </div>
                </Link>
              ))}

            {/* Course results */}
            {activeTab === 'courses' &&
              results.map((course: any) => (
                <Link
                  key={course.id}
                  href={`/classroom/${course.slug}`}
                  onClick={handleItemClick}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                >
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt=""
                      className="h-10 w-14 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-14 rounded bg-secondary flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {course.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {course.description?.slice(0, 100)}
                    </p>
                  </div>
                  {course.isPaid && (
                    <span className="text-xs font-medium text-foreground bg-secondary px-2 py-0.5 rounded">
                      Paid
                    </span>
                  )}
                </Link>
              ))}

            {/* Member results */}
            {activeTab === 'members' &&
              results.map((member: any) => (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  onClick={handleItemClick}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {member.name || 'Unnamed'}
                      </p>
                      <LevelBadge level={member.level} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {member.points} points
                    </p>
                  </div>
                </Link>
              ))}
          </div>

          {/* Footer */}
          {query && total > 0 && (
            <div className="border-t border-border px-4 py-2">
              <button
                onClick={handleGoToSearch}
                className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 py-1"
              >
                View all results ({total})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
