/**
 * One-time script: assigns the "general" category to all posts with categoryId = NULL.
 *
 * Usage:  npx tsx scripts/migrate-uncategorized-posts.ts
 */
import 'dotenv/config';
import { db } from '../lib/db/drizzle';
import { posts, categories } from '../lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

const GENERAL = { name: 'General', slug: 'general', color: '#6B7280' };

async function main() {
  // Ensure the "general" category exists
  let [general] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, GENERAL.slug))
    .limit(1);

  if (!general) {
    [general] = await db
      .insert(categories)
      .values(GENERAL)
      .returning({ id: categories.id });
    console.log(`Created "general" category (id=${general.id})`);
  } else {
    console.log(`"general" category already exists (id=${general.id})`);
  }

  // Update all posts with no category
  const result = await db
    .update(posts)
    .set({ categoryId: general.id })
    .where(isNull(posts.categoryId));

  console.log(`Updated ${result.rowCount ?? 0} uncategorized post(s) → general`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
