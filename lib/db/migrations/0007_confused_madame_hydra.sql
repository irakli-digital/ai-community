CREATE TABLE "waiting_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waiting_list_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "community_settings" ALTER COLUMN "name" SET DEFAULT 'AI Circle';