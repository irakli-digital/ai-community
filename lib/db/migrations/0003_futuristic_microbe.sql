CREATE TABLE "point_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"points" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"source_user_id" integer,
	"source_type" varchar(20),
	"source_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_source_user_id_users_id_fk" FOREIGN KEY ("source_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "point_events_user_id_idx" ON "point_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "point_events_created_at_idx" ON "point_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "point_events_user_created_idx" ON "point_events" USING btree ("user_id","created_at");