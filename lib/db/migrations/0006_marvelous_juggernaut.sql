ALTER TABLE "users" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
CREATE INDEX "users_last_seen_at_idx" ON "users" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "users_points_idx" ON "users" USING btree ("points");--> statement-breakpoint
CREATE INDEX "users_level_idx" ON "users" USING btree ("level");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");