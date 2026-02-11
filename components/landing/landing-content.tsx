'use client';

import { useState } from 'react';
import { Users, Wifi, ArrowRight, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/auth-modal';
import { t } from '@/lib/i18n/ka';

type SerializedPost = {
  id: number;
  title: string;
  content: string;
  featuredImageUrl: string | null;
  createdAt: string;
  author: { id: number; name: string | null; avatarUrl: string | null };
  category: { id: number; name: string; color: string } | null;
  commentsCount: number;
  likesCount: number;
};

interface LandingContentProps {
  communityName: string;
  description: string;
  aboutContent: string;
  memberCount: number;
  onlineCount: number;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  latestPosts: SerializedPost[];
}

export function LandingContent({
  communityName,
  description,
  aboutContent,
  memberCount,
  onlineCount,
  logoUrl,
  coverImageUrl,
  latestPosts,
}: LandingContentProps) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  function openAuth(mode: 'signin' | 'signup') {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Grid background covering the full page */}
      <div className="absolute inset-0 grid-background opacity-60" />

      {/* Radial fade overlay to soften the grid edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, hsl(25 8% 5%) 75%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt={communityName} className="h-8 w-8" />
            <span className="text-lg font-semibold text-foreground">
              {communityName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => openAuth('signin')}>
              {t('auth.signIn')}
            </Button>
            <Button
              onClick={() => openAuth('signup')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
            >
              {t('landing.join')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero / Cover */}
      <div className="relative z-10">
        {coverImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${coverImageUrl})` }}
          />
        )}
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <img
              src={logoUrl || '/logo.svg'}
              alt={communityName}
              className="mx-auto h-20 w-20"
            />
            <h1 className="mt-6 text-4xl font-bold text-foreground sm:text-5xl">
              {communityName}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>

            {/* Stats */}
            <div className="mt-8 flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-medium text-foreground">{memberCount}</span>
                <span>{t('landing.members')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                <span className="font-medium text-foreground">{onlineCount}</span>
                <span>{t('landing.online')}</span>
              </div>
            </div>

            <div className="mt-8">
              <Button
                size="lg"
                onClick={() => openAuth('signup')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-lg px-8 font-semibold"
              >
                {t('landing.join')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {t('landing.aboutCommunity')}
        </h2>
        <div className="prose prose-invert max-w-none">
          <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
            {aboutContent}
          </p>
        </div>
      </section>

      {/* Latest Articles */}
      {latestPosts.length > 0 && (
        <section className="relative z-10 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              {t('landing.latestArticles')}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => {
                const preview =
                  post.content.length > 120
                    ? post.content.slice(0, 120) + '...'
                    : post.content;
                const date = new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <article
                    key={post.id}
                    className="group flex flex-col rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
                    onClick={() => openAuth('signup')}
                  >
                    {post.featuredImageUrl && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={post.featuredImageUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {post.category && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: post.category.color }}
                          >
                            {post.category.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{date}</span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3 flex-1">
                        {preview}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-medium text-muted-foreground">
                            {post.author.avatarUrl ? (
                              <img
                                src={post.author.avatarUrl}
                                alt=""
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              (post.author.name?.[0] ?? '?').toUpperCase()
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {post.author.name ?? 'User'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {post.likesCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {post.commentsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => openAuth('signup')}
                className="rounded-md"
              >
                {t('landing.viewAllArticles')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {communityName}. All rights reserved.
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
