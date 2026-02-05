'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateAccount } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import { t } from '@/lib/i18n/ka';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

function ProfileFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);

  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">{t('settings.name')}</Label>
        <Input
          id="name"
          name="name"
          placeholder={t('settings.namePlaceholder')}
          defaultValue={state.name || user?.name || ''}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">{t('auth.email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          defaultValue={user?.email || ''}
          required
        />
      </div>
    </>
  );
}

export default function ProfileSettingsPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.accountInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={formAction}>
          <Suspense
            fallback={
              <div className="space-y-4">
                <div>
                  <Label className="mb-2">{t('settings.name')}</Label>
                  <Input disabled placeholder={t('common.loading')} />
                </div>
                <div>
                  <Label className="mb-2">{t('auth.email')}</Label>
                  <Input disabled placeholder={t('common.loading')} />
                </div>
              </div>
            }
          >
            <ProfileFormWithData state={state} />
          </Suspense>
          {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
          {state.success && <p className="text-green-500 text-sm">{state.success}</p>}
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('settings.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
