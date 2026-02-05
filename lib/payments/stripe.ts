import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { User } from '@/lib/db/schema';
import {
  getUserByStripeCustomerId,
  getUser,
  getUserSubscription,
  updateUserSubscription,
} from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmailAsync } from '@/lib/email/mailgun';
import {
  subscriptionConfirmationEmail,
  subscriptionCancellationEmail,
} from '@/lib/email/templates';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function createCheckoutSession({
  user,
  priceId,
}: {
  user: User | null;
  priceId: string;
}) {
  const currentUser = user || (await getUser());

  if (!currentUser) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    customer: currentUser.stripeCustomerId || undefined,
    client_reference_id: currentUser.id.toString(),
    allow_promotion_codes: true,
  });

  redirect(session.url!);
}

export async function createCustomerPortalSession(user: User) {
  const subscription = await getUserSubscription(user.id);

  if (!user.stripeCustomerId || !subscription?.stripeProductId) {
    redirect('/pricing');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    const product = await stripe.products.retrieve(subscription.stripeProductId);
    if (!product.active) {
      throw new Error("User's product is not active in Stripe");
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
    });
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the user's product");
    }

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'გამოწერის მართვა', // Manage your subscription
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id),
            },
          ],
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other',
            ],
          },
        },
        payment_method_update: {
          enabled: true,
        },
      },
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.BASE_URL}/settings/billing`,
    configuration: configuration.id,
  });
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const user = await getUserByStripeCustomerId(customerId);

  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  const item = subscription.items.data[0];
  const plan = item?.plan;

  if (status === 'active' || status === 'trialing') {
    // Check if this is a new subscription (not just renewal)
    const existingSub = await getUserSubscription(user.id);
    const isNewSubscription = !existingSub || existingSub.status !== 'active';

    await updateUserSubscription(user.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      stripePriceId: plan?.id || null,
      status,
      currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    // Send subscription confirmation email for new subscriptions
    if (isNewSubscription) {
      const template = subscriptionConfirmationEmail({ name: user.name || undefined });
      sendEmailAsync({ to: user.email, ...template });
    }
  } else if (status === 'canceled' || status === 'unpaid') {
    // Send cancellation email
    const periodEndTimestamp = item?.current_period_end;
    const periodEnd = periodEndTimestamp
      ? new Date(periodEndTimestamp * 1000).toLocaleDateString('ka-GE')
      : undefined;
    const template = subscriptionCancellationEmail({
      name: user.name || undefined,
      periodEnd,
    });
    sendEmailAsync({ to: user.email, ...template });

    await updateUserSubscription(user.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      stripePriceId: null,
      status,
    });
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'recurring',
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days,
  }));
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id,
  }));
}
