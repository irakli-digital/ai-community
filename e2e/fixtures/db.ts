import postgres from 'postgres';
import { hashPassword } from './helpers';

const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';

let sql: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (!sql) {
    sql = postgres(DATABASE_URL);
  }
  return sql;
}

/**
 * Clean all test data from the database.
 * Deletes users with emails matching @test.com pattern.
 */
export async function cleanTestData() {
  const db = getDb();
  // Delete test users and cascade will handle related data
  await db`DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`;
  await db`DELETE FROM point_events WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`;
  await db`DELETE FROM course_progress WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`;
  await db`DELETE FROM comment_likes WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`;
  await db`DELETE FROM post_likes WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`;
  await db`DELETE FROM comments WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`;
  await db`DELETE FROM post_images WHERE post_id IN (SELECT id FROM posts WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@test.com'))`;
  await db`DELETE FROM post_links WHERE post_id IN (SELECT id FROM posts WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@test.com'))`;
  await db`DELETE FROM posts WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`;
  await db`DELETE FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`;
  await db`DELETE FROM activity_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`;
  await db`DELETE FROM users WHERE email LIKE '%@test.com'`;
}

/**
 * Seed the database with test users.
 * Returns the created user IDs.
 */
export async function seedTestUsers() {
  const db = getDb();
  const passwordHash = await hashPassword('testpass123');

  // Create admin user
  const [admin] = await db`
    INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
    VALUES ('admin@test.com', ${passwordHash}, 'ადმინი', 'admin', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET role = 'admin'
    RETURNING id
  `;

  // Create paid member
  const [paidMember] = await db`
    INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
    VALUES ('paid@test.com', ${passwordHash}, 'ფასიანი წევრი', 'member', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET name = 'ფასიანი წევრი'
    RETURNING id
  `;

  // Create subscription for paid member
  await db`
    INSERT INTO subscriptions (user_id, stripe_subscription_id, status, created_at, updated_at)
    VALUES (${paidMember.id}, 'sub_test_paid', 'active', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET status = 'active'
  `;

  // Create free member
  const [freeMember] = await db`
    INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
    VALUES ('free@test.com', ${passwordHash}, 'უფასო წევრი', 'member', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET name = 'უფასო წევრი'
    RETURNING id
  `;

  return {
    adminId: admin.id,
    paidMemberId: paidMember.id,
    freeMemberId: freeMember.id,
  };
}

/**
 * Seed test categories
 */
export async function seedTestCategories() {
  const db = getDb();

  await db`
    INSERT INTO categories (name, slug, description, color, sort_order, created_at, updated_at)
    VALUES
      ('შესავალი', 'intro', 'საწყისი პოსტები', '#3B82F6', 1, NOW(), NOW()),
      ('კითხვა-პასუხი', 'qa', 'კითხვებისა და პასუხების სექცია', '#10B981', 2, NOW(), NOW()),
      ('რესურსები', 'resources', 'სასარგებლო რესურსები', '#F59E0B', 3, NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING
  `;
}

/**
 * Create a test post directly in DB
 */
export async function createTestPost(authorId: number, categorySlug?: string) {
  const db = getDb();

  let categoryId = null;
  if (categorySlug) {
    const [cat] = await db`SELECT id FROM categories WHERE slug = ${categorySlug}`;
    if (cat) categoryId = cat.id;
  }

  const [post] = await db`
    INSERT INTO posts (author_id, category_id, title, content, created_at, updated_at)
    VALUES (${authorId}, ${categoryId}, 'სატესტო პოსტი', 'ეს არის სატესტო კონტენტი', NOW(), NOW())
    RETURNING id
  `;

  return post.id;
}

export async function closeDb() {
  if (sql) {
    await sql.end();
    sql = null;
  }
}
