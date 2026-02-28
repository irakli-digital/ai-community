-- Add survey sections table
CREATE TABLE IF NOT EXISTS "survey_sections" (
  "id" serial PRIMARY KEY NOT NULL,
  "survey_id" integer NOT NULL,
  "title" varchar(300) NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "show_intermediate_results" boolean DEFAULT false NOT NULL,
  "continue_button_text" varchar(200),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add indexes for survey_sections
CREATE INDEX IF NOT EXISTS "survey_sections_survey_id_idx" ON "survey_sections" USING btree ("survey_id");
CREATE INDEX IF NOT EXISTS "survey_sections_sort_idx" ON "survey_sections" USING btree ("survey_id","sort_order");

-- Add FK constraint for survey_sections → surveys
ALTER TABLE "survey_sections" ADD CONSTRAINT "survey_sections_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE cascade ON UPDATE no action;

-- Add section_id column to survey_steps (nullable for backward compat)
ALTER TABLE "survey_steps" ADD COLUMN IF NOT EXISTS "section_id" integer;

-- Add index on section_id
CREATE INDEX IF NOT EXISTS "survey_steps_section_id_idx" ON "survey_steps" USING btree ("section_id");

-- Add FK constraint for survey_steps.section_id → survey_sections
ALTER TABLE "survey_steps" ADD CONSTRAINT "survey_steps_section_id_survey_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "survey_sections"("id") ON DELETE cascade ON UPDATE no action;
