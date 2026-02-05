'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, ExternalLink } from 'lucide-react';
import { customerPortalAction } from '@/lib/payments/actions';
import { t } from '@/lib/i18n/ka';

export default function BillingSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('billing.currentPlan')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          გამოწერის მართვისთვის გადახვიდეთ Stripe-ის პორტალზე.
        </p>
        <form action={customerPortalAction}>
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {t('billing.manage')}
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
