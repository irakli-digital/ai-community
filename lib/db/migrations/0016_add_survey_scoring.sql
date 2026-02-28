-- Survey Score Config (subscore definitions)
CREATE TABLE IF NOT EXISTS "survey_score_config" (
  "id" serial PRIMARY KEY NOT NULL,
  "survey_id" integer NOT NULL,
  "name" varchar(100) NOT NULL,
  "step_ids" text NOT NULL,
  "max_points" integer NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "survey_score_config_survey_id_idx" ON "survey_score_config" USING btree ("survey_id");
ALTER TABLE "survey_score_config" ADD CONSTRAINT "survey_score_config_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE cascade ON UPDATE no action;

-- Survey Answer Weights (points per answer option)
CREATE TABLE IF NOT EXISTS "survey_answer_weights" (
  "id" serial PRIMARY KEY NOT NULL,
  "step_id" integer NOT NULL,
  "answer_value" text NOT NULL,
  "points" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "survey_answer_weights_step_id_idx" ON "survey_answer_weights" USING btree ("step_id");
ALTER TABLE "survey_answer_weights" ADD CONSTRAINT "survey_answer_weights_step_id_survey_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "survey_steps"("id") ON DELETE cascade ON UPDATE no action;

-- Survey Category Thresholds (maturity categories)
CREATE TABLE IF NOT EXISTS "survey_category_thresholds" (
  "id" serial PRIMARY KEY NOT NULL,
  "survey_id" integer NOT NULL,
  "min_score" integer NOT NULL,
  "max_score" integer NOT NULL,
  "label" varchar(100) NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS "survey_category_thresholds_survey_id_idx" ON "survey_category_thresholds" USING btree ("survey_id");
ALTER TABLE "survey_category_thresholds" ADD CONSTRAINT "survey_category_thresholds_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE cascade ON UPDATE no action;

-- Add scoring columns to survey_responses
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "score_total" integer;
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "score_breakdown" text;
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "category" varchar(100);
