-- Step 1: Add slug as nullable
ALTER TABLE "posts" ADD COLUMN "slug" varchar(350);--> statement-breakpoint

-- Step 2: Backfill existing posts with slugified title + id for uniqueness
UPDATE "posts" SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE("title", '[^\w\s-]', '', 'g'),
        '[\s_]+', '-', 'g'
      ),
      '-+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  )
) || '-' || "id";--> statement-breakpoint

-- Step 3: Make slug NOT NULL
ALTER TABLE "posts" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint

-- Step 4: Add unique index and constraint
CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_slug_unique" UNIQUE("slug");
