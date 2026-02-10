'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Crosshair, CrosshairMark } from '@/components/shared/crosshair';
import { joinWaitingList } from './actions';

export default function WaitingListPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!email.trim() || isSubmitting) return;

      setIsSubmitting(true);
      setError('');

      const result = await joinWaitingList({ email: email.trim() });

      if ('success' in result) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }

      setIsSubmitting(false);
    },
    [email, isSubmitting]
  );

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Grid background covering the full page */}
      <div className="absolute inset-0 grid-background opacity-60" />

      {/* Radial fade overlay to soften the grid edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, hsl(0 0% 4%) 75%)',
        }}
      />

      {/* Decorative crosshairs */}
      <div className="absolute top-8 left-8 hidden sm:block">
        <Crosshair className="text-muted-foreground/30" />
      </div>
      <div className="absolute top-8 right-8 hidden sm:block">
        <Crosshair className="text-muted-foreground/30" />
      </div>
      <div className="absolute bottom-8 left-8 hidden sm:block">
        <Crosshair className="text-muted-foreground/30" />
      </div>
      <div className="absolute bottom-8 right-8 hidden sm:block">
        <Crosshair className="text-muted-foreground/30" />
      </div>

      {/* Additional crosshairs for visual depth */}
      <div className="absolute top-1/4 left-16 hidden lg:block">
        <Crosshair className="text-muted-foreground/20" />
      </div>
      <div className="absolute top-1/3 right-24 hidden lg:block">
        <Crosshair className="text-muted-foreground/15" />
      </div>
      <div className="absolute bottom-1/4 left-32 hidden lg:block">
        <Crosshair className="text-muted-foreground/15" />
      </div>
      <div className="absolute bottom-1/3 right-16 hidden lg:block">
        <Crosshair className="text-muted-foreground/20" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-xl text-center">
          {/* Logo */}
          <img
            src="/logo.svg"
            alt="Agentic Tribe"
            className="mx-auto mb-8 h-16 w-16"
          />

          {/* Title */}
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Agentic Tribe
          </h1>

          {/* Divider line */}
          <div className="mx-auto mt-6 h-px w-16 bg-border" />

          {/* Philosophy */}
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            A tribe of builders exploring agentic AI. We build, share, and learn
            together - every member contributes. This is not a spectator
            community. It is a collective of makers pushing the boundaries of
            what autonomous agents can do.
          </p>

          {/* Card with form */}
          <div className="relative mx-auto mt-12 max-w-md">
            {/* Crosshair decorations on the card */}
            <CrosshairMark position="top-left" />
            <CrosshairMark position="top-right" />
            <CrosshairMark position="bottom-left" />
            <CrosshairMark position="bottom-right" />

            <div className="border border-border bg-card p-8">
              {submitted ? (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
                    <Check className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      You are on the list.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We will reach out when it is your turn to join the tribe.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Request access to join the waiting list. Spots are limited.
                  </p>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="h-10 flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting || !email.trim()}
                      className="h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 font-medium"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                          <span>Submitting</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span>Join</span>
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                  {error && (
                    <p className="mt-3 text-sm text-destructive">{error}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom tagline */}
          <p className="mt-12 text-xs tracking-widest uppercase text-muted-foreground/60">
            By builders, for builders
          </p>
        </div>
      </div>

      {/* Bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
