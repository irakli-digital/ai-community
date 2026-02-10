import { stripe } from '../payments/stripe';
import { db } from './drizzle';
import { users, communitySettings } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const product = await stripe.products.create({
    name: 'Agentic Tribe — Paid Plan',
    description: 'Full access to all features',
  });

  await stripe.prices.create({
    product: product.id,
    unit_amount: 1500, // ₾15 in tetri
    currency: 'gel',
    recurring: {
      interval: 'month',
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@aicircle.ge';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email,
        passwordHash,
        name: 'Admin',
        role: 'admin',
      },
    ])
    .returning();

  console.log('Admin user created:', user.email);

  // Create initial community settings
  await db.insert(communitySettings).values({
    name: 'Agentic Tribe',
    description: 'AI & technology community — learn, share, grow.',
    aboutContent:
      'Agentic Tribe is a technology community where you can learn about artificial intelligence, automation, and modern technologies. Join us and become part of our community!',
    adminUserId: user.id,
  });

  console.log('Community settings created.');

  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
