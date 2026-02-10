'use client';

import { useState } from 'react';
import { Users, Wifi, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/auth-modal';
import { t } from '@/lib/i18n/ka';

interface LandingContentProps {
  communityName: string;
  description: string;
  aboutContent: string;
  memberCount: number;
  onlineCount: number;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
}

export function LandingContent({
  communityName,
  description,
  aboutContent,
  memberCount,
  onlineCount,
  logoUrl,
  coverImageUrl,
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

      {/* Pricing */}
      <section className="relative z-10 bg-card border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">
            {t('landing.pricing')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-lg border border-border bg-secondary p-8">
              <h3 className="text-xl font-semibold text-foreground">
                {t('landing.free')}
              </h3>
              <p className="mt-2 text-3xl font-bold text-foreground">₾0</p>
              <p className="text-sm text-muted-foreground mt-1">{t('landing.freePlanDesc')}</p>
              <ul className="mt-6 space-y-3">
                {([
                  'pricing.free.viewPosts',
                  'pricing.free.comment',
                  'pricing.free.viewCourses',
                  'pricing.free.viewLeaderboard',
                  'pricing.free.memberDirectory',
                ] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                onClick={() => openAuth('signup')}
                className="w-full mt-8 rounded-md"
              >
                {t('landing.join')}
              </Button>
            </div>

            {/* Paid Plan */}
            <div className="rounded-lg border-2 border-primary bg-secondary p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Recommended
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                {t('landing.paid')}
              </h3>
              <p className="mt-2 text-3xl font-bold text-foreground">
                ₾?? <span className="text-base font-normal text-muted-foreground">{t('landing.perMonth')}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{t('landing.paidPlanDesc')}</p>
              <ul className="mt-6 space-y-3">
                {([
                  'pricing.paid.allFreeFeatures',
                  'pricing.paid.createPosts',
                  'pricing.paid.likePosts',
                  'pricing.paid.accessCourses',
                  'pricing.paid.leaderboard',
                ] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => openAuth('signup')}
                className="w-full mt-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
              >
                {t('landing.join')}
              </Button>
            </div>
          </div>
        </div>
      </section>

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
