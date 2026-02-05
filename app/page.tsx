import Link from 'next/link';
import { getCommunitySettings, getMemberCount, getOnlineMemberCount } from '@/lib/db/queries';
import { t } from '@/lib/i18n/ka';
import { Users, Wifi, Shield, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function LandingPage() {
  const [settings, memberCount, onlineCount] = await Promise.all([
    getCommunitySettings(),
    getMemberCount(),
    getOnlineMemberCount(),
  ]);

  const communityName = settings?.name || t('common.appName');
  const description =
    settings?.description ||
    'ქართული AI/ტექნოლოგიური საზოგადოება — ისწავლე, გაუზიარე, გაიზარდე.';
  const aboutContent =
    settings?.aboutContent ||
    'AI წრე არის ქართული ტექნოლოგიური საზოგადოება, სადაც შეგიძლია ისწავლო ხელოვნური ინტელექტი, ავტომატიზაცია და თანამედროვე ტექნოლოგიები. შემოგვიერთდი და გახდი ჩვენი თემის ნაწილი!';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold text-sm">
              AI
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {communityName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">{t('auth.signIn')}</Link>
            </Button>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full">
              <Link href="/sign-up">{t('landing.join')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero / Cover */}
      <div className="relative bg-gradient-to-br from-orange-500 to-orange-600">
        {settings?.coverImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${settings.coverImageUrl})` }}
          />
        )}
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={communityName}
                className="mx-auto h-20 w-20 rounded-2xl shadow-lg"
              />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-white font-bold text-3xl shadow-lg backdrop-blur-sm">
                AI
              </div>
            )}
            <h1 className="mt-6 text-4xl font-bold text-white sm:text-5xl">
              {communityName}
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
              {description}
            </p>

            {/* Stats */}
            <div className="mt-8 flex items-center justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="font-medium">{memberCount}</span>
                <span>{t('landing.members')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                <span className="font-medium">{onlineCount}</span>
                <span>{t('landing.online')}</span>
              </div>
            </div>

            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 rounded-full text-lg px-8 font-semibold"
              >
                <Link href="/sign-up">
                  {t('landing.join')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('landing.aboutCommunity')}
        </h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
            {aboutContent}
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            {t('landing.pricing')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('landing.free')}
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">₾0</p>
              <p className="text-sm text-gray-500 mt-1">{t('landing.freePlanDesc')}</p>
              <ul className="mt-6 space-y-3">
                {([
                  'pricing.free.viewPosts',
                  'pricing.free.comment',
                  'pricing.free.viewCourses',
                  'pricing.free.viewLeaderboard',
                  'pricing.free.memberDirectory',
                ] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant="outline"
                className="w-full mt-8 rounded-full"
              >
                <Link href="/sign-up">{t('landing.join')}</Link>
              </Button>
            </div>

            {/* Paid Plan */}
            <div className="rounded-2xl border-2 border-orange-500 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                რეკომენდებული
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {t('landing.paid')}
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                ₾?? <span className="text-base font-normal text-gray-500">{t('landing.perMonth')}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">{t('landing.paidPlanDesc')}</p>
              <ul className="mt-6 space-y-3">
                {([
                  'pricing.paid.allFreeFeatures',
                  'pricing.paid.createPosts',
                  'pricing.paid.likePosts',
                  'pricing.paid.accessCourses',
                  'pricing.paid.leaderboard',
                ] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="w-full mt-8 bg-orange-500 hover:bg-orange-600 rounded-full"
              >
                <Link href="/sign-up">{t('landing.join')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {communityName}. ყველა უფლება დაცულია.
        </div>
      </footer>
    </div>
  );
}
