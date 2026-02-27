CREATE TABLE "sidebar_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(300),
	"subtitle" text,
	"image_url" text,
	"link_url" text,
	"show_button" boolean DEFAULT false NOT NULL,
	"button_text" varchar(100) DEFAULT 'Learn More' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"response_id" integer NOT NULL,
	"step_id" integer NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"survey_id" integer NOT NULL,
	"respondent_name" varchar(200),
	"respondent_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"survey_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"question_type" varchar(30) NOT NULL,
	"label" text NOT NULL,
	"options" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(300) NOT NULL,
	"slug" varchar(350),
	"description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "surveys_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_response_id_survey_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."survey_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_step_id_survey_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."survey_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_steps" ADD CONSTRAINT "survey_steps_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sidebar_banners_is_active_sort_idx" ON "sidebar_banners" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "survey_answers_response_id_idx" ON "survey_answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "survey_answers_step_id_idx" ON "survey_answers" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_id_idx" ON "survey_responses" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_responses_created_at_idx" ON "survey_responses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "survey_steps_survey_id_idx" ON "survey_steps" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_steps_sort_idx" ON "survey_steps" USING btree ("survey_id","step_number");--> statement-breakpoint
CREATE INDEX "surveys_created_by_idx" ON "surveys" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "surveys_is_published_idx" ON "surveys" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "surveys_created_at_idx" ON "surveys" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "surveys_slug_idx" ON "surveys" USING btree ("slug");