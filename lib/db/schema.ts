import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ─── Users ──────────────────────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 20 }).notNull().default('member'),
    // Profile fields
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    location: varchar('location', { length: 200 }),
    websiteUrl: text('website_url'),
    facebookUrl: text('facebook_url'),
    linkedinUrl: text('linkedin_url'),
    twitterUrl: text('twitter_url'),
    // Gamification
    points: integer('points').notNull().default(0),
    level: integer('level').notNull().default(1),
    // Online status
    lastSeenAt: timestamp('last_seen_at'),
    // Stripe
    stripeCustomerId: text('stripe_customer_id').unique(),
    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('users_last_seen_at_idx').on(table.lastSeenAt),
    index('users_points_idx').on(table.points),
    index('users_level_idx').on(table.level),
    index('users_deleted_at_idx').on(table.deletedAt),
  ]
);

// ─── Subscriptions (user-based billing) ─────────────────────────────────────
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id)
    .unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  status: varchar('status', { length: 20 }).notNull().default('inactive'),
  priceAmountGel: integer('price_amount_gel'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Community Settings (single row) ────────────────────────────────────────
export const communitySettings = pgTable('community_settings', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull().default('Agentic Tribe'),
  description: text('description'),
  aboutContent: text('about_content'),
  logoUrl: text('logo_url'),
  coverImageUrl: text('cover_image_url'),
  adminUserId: integer('admin_user_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Categories ─────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).notNull().default('#6B7280'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─── Activity Logs (refactored: no team dependency) ─────────────────────────
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

// ─── Posts ───────────────────────────────────────────────────────────────────
export const posts = pgTable(
  'posts',
  {
    id: serial('id').primaryKey(),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id),
    categoryId: integer('category_id').references(() => categories.id),
    title: varchar('title', { length: 300 }).notNull(),
    slug: varchar('slug', { length: 350 }).notNull().unique(),
    content: text('content').notNull(),
    featuredImageUrl: text('featured_image_url'),
    isDraft: boolean('is_draft').notNull().default(false),
    isPinned: boolean('is_pinned').notNull().default(false),
    likesCount: integer('likes_count').notNull().default(0),
    commentsCount: integer('comments_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('posts_author_id_idx').on(table.authorId),
    index('posts_category_id_idx').on(table.categoryId),
    index('posts_created_at_id_idx').on(table.createdAt, table.id),
    index('posts_is_pinned_idx').on(table.isPinned),
    uniqueIndex('posts_slug_idx').on(table.slug),
  ]
);

// ─── Post Images ────────────────────────────────────────────────────────────
export const postImages = pgTable(
  'post_images',
  {
    id: serial('id').primaryKey(),
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    altText: varchar('alt_text', { length: 300 }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('post_images_post_id_idx').on(table.postId)]
);

// ─── Post Links (OG metadata) ──────────────────────────────────────────────
export const postLinks = pgTable(
  'post_links',
  {
    id: serial('id').primaryKey(),
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    title: varchar('title', { length: 300 }),
    description: text('description'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('post_links_post_id_idx').on(table.postId)]
);

// ─── Comments ───────────────────────────────────────────────────────────────
export const comments = pgTable(
  'comments',
  {
    id: serial('id').primaryKey(),
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id),
    parentId: integer('parent_id'), // self-ref for threading
    content: text('content').notNull(),
    likesCount: integer('likes_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('comments_post_id_idx').on(table.postId),
    index('comments_author_id_idx').on(table.authorId),
    index('comments_parent_id_idx').on(table.parentId),
  ]
);

// ─── Post Likes ─────────────────────────────────────────────────────────────
export const postLikes = pgTable(
  'post_likes',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('post_likes_user_post_unique').on(table.userId, table.postId),
  ]
);

// ─── Comment Likes ──────────────────────────────────────────────────────────
export const commentLikes = pgTable(
  'comment_likes',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    commentId: integer('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('comment_likes_user_comment_unique').on(
      table.userId,
      table.commentId
    ),
  ]
);

// ─── Courses ────────────────────────────────────────────────────────────────
export const courses = pgTable(
  'courses',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 300 }).notNull(),
    slug: varchar('slug', { length: 300 }).notNull().unique(),
    description: text('description'),
    thumbnailUrl: text('thumbnail_url'),
    isPaid: boolean('is_paid').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    totalLessons: integer('total_lessons').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('courses_slug_idx').on(table.slug),
    index('courses_sort_order_idx').on(table.sortOrder),
    index('courses_is_published_idx').on(table.isPublished),
  ]
);

// ─── Course Sections ────────────────────────────────────────────────────────
export const courseSections = pgTable(
  'course_sections',
  {
    id: serial('id').primaryKey(),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 300 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('course_sections_course_id_idx').on(table.courseId),
    index('course_sections_sort_order_idx').on(table.courseId, table.sortOrder),
  ]
);

// ─── Lessons ────────────────────────────────────────────────────────────────
export const lessons = pgTable(
  'lessons',
  {
    id: serial('id').primaryKey(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => courseSections.id, { onDelete: 'cascade' }),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 300 }).notNull(),
    description: text('description'),
    videoUrl: text('video_url'),
    videoProvider: varchar('video_provider', { length: 20 }), // 'youtube' | 'vimeo'
    content: text('content'), // Markdown
    sortOrder: integer('sort_order').notNull().default(0),
    durationSeconds: integer('duration_seconds'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('lessons_section_id_idx').on(table.sectionId),
    index('lessons_course_id_idx').on(table.courseId),
    index('lessons_sort_order_idx').on(table.sectionId, table.sortOrder),
  ]
);

// ─── Lesson Attachments ─────────────────────────────────────────────────────
export const lessonAttachments = pgTable(
  'lesson_attachments',
  {
    id: serial('id').primaryKey(),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 500 }).notNull(),
    fileUrl: text('file_url').notNull(),
    fileSizeBytes: integer('file_size_bytes'),
    mimeType: varchar('mime_type', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('lesson_attachments_lesson_id_idx').on(table.lessonId)]
);

// ─── Course Progress ────────────────────────────────────────────────────────
export const courseProgress = pgTable(
  'course_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('course_progress_user_lesson_unique').on(
      table.userId,
      table.lessonId
    ),
    index('course_progress_user_course_idx').on(table.userId, table.courseId),
    index('course_progress_course_id_idx').on(table.courseId),
  ]
);

// ─── Waiting List ────────────────────────────────────────────────────────────
export const waitingList = pgTable('waiting_list', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Relations ──────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  activityLogs: many(activityLogs),
  posts: many(posts),
  comments: many(comments),
  postLikes: many(postLikes),
  commentLikes: many(commentLikes),
  pointEventsReceived: many(pointEvents, { relationName: 'pointEventsReceived' }),
  pointEventsGiven: many(pointEvents, { relationName: 'pointEventsGiven' }),
  courseProgress: many(courseProgress),
  notifications: many(notifications),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  images: many(postImages),
  links: many(postLinks),
  comments: many(comments),
  likes: many(postLikes),
}));

export const postImagesRelations = relations(postImages, ({ one }) => ({
  post: one(posts, {
    fields: [postImages.postId],
    references: [posts.id],
  }),
}));

export const postLinksRelations = relations(postLinks, ({ one }) => ({
  post: one(posts, {
    fields: [postLinks.postId],
    references: [posts.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'commentReplies',
  }),
  replies: many(comments, { relationName: 'commentReplies' }),
  likes: many(commentLikes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
}));

// ─── Point Events (gamification audit log) ──────────────────────────────────
export const pointEvents = pgTable(
  'point_events',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    points: integer('points').notNull(), // +1 or -1
    reason: varchar('reason', { length: 50 }).notNull(), // 'post_liked', 'comment_liked', 'post_unliked', 'comment_unliked'
    sourceUserId: integer('source_user_id').references(() => users.id), // the liker
    sourceType: varchar('source_type', { length: 20 }), // 'post' or 'comment'
    sourceId: integer('source_id'), // postId or commentId
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('point_events_user_id_idx').on(table.userId),
    index('point_events_created_at_idx').on(table.createdAt),
    index('point_events_user_created_idx').on(table.userId, table.createdAt),
  ]
);

// ─── Point Events Relations ─────────────────────────────────────────────────
export const pointEventsRelations = relations(pointEvents, ({ one }) => ({
  user: one(users, {
    fields: [pointEvents.userId],
    references: [users.id],
    relationName: 'pointEventsReceived',
  }),
  sourceUser: one(users, {
    fields: [pointEvents.sourceUserId],
    references: [users.id],
    relationName: 'pointEventsGiven',
  }),
}));

// ─── Course Relations ───────────────────────────────────────────────────────
export const coursesRelations = relations(courses, ({ many }) => ({
  sections: many(courseSections),
  lessons: many(lessons),
  progress: many(courseProgress),
}));

export const courseSectionsRelations = relations(
  courseSections,
  ({ one, many }) => ({
    course: one(courses, {
      fields: [courseSections.courseId],
      references: [courses.id],
    }),
    lessons: many(lessons),
  })
);

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  section: one(courseSections, {
    fields: [lessons.sectionId],
    references: [courseSections.id],
  }),
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  attachments: many(lessonAttachments),
  progress: many(courseProgress),
}));

export const lessonAttachmentsRelations = relations(
  lessonAttachments,
  ({ one }) => ({
    lesson: one(lessons, {
      fields: [lessonAttachments.lessonId],
      references: [lessons.id],
    }),
  })
);

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
  user: one(users, {
    fields: [courseProgress.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [courseProgress.courseId],
    references: [courses.id],
  }),
  lesson: one(lessons, {
    fields: [courseProgress.lessonId],
    references: [lessons.id],
  }),
}));

// ─── Notifications ──────────────────────────────────────────────────────────
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 30 }).notNull(), // post_like, comment_like, post_comment, comment_reply, level_up, new_course, announcement
    title: varchar('title', { length: 500 }).notNull(),
    body: text('body'),
    linkUrl: text('link_url'),
    actorId: integer('actor_id').references(() => users.id),
    isRead: boolean('is_read').notNull().default(false),
    isEmailSent: boolean('is_email_sent').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('notifications_user_read_created_idx').on(
      table.userId,
      table.isRead,
      table.createdAt
    ),
    index('notifications_user_id_idx').on(table.userId),
  ]
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: 'notificationActor',
  }),
}));

// ─── Types ──────────────────────────────────────────────────────────────────
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type CommunitySettingsRow = typeof communitySettings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostImage = typeof postImages.$inferSelect;
export type NewPostImage = typeof postImages.$inferInsert;
export type PostLink = typeof postLinks.$inferSelect;
export type NewPostLink = typeof postLinks.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type CommentLike = typeof commentLikes.$inferSelect;
export type PointEvent = typeof pointEvents.$inferSelect;
export type NewPointEvent = typeof pointEvents.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseSection = typeof courseSections.$inferSelect;
export type NewCourseSection = typeof courseSections.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type LessonAttachment = typeof lessonAttachments.$inferSelect;
export type NewLessonAttachment = typeof lessonAttachments.$inferInsert;
export type CourseProgress = typeof courseProgress.$inferSelect;
export type NewCourseProgress = typeof courseProgress.$inferInsert;
export type WaitingListEntry = typeof waitingList.$inferSelect;
export type NewWaitingListEntry = typeof waitingList.$inferInsert;

// ─── Activity Types ─────────────────────────────────────────────────────────
export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_POST = 'CREATE_POST',
  DELETE_POST = 'DELETE_POST',
  CREATE_COMMENT = 'CREATE_COMMENT',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
}
