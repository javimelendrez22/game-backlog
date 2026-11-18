ALTER TABLE "games" ADD COLUMN "igdb_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "games_igdb_id_unique" ON "games" ("igdb_id");--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_igdb_id_positive" CHECK ("igdb_id" > 0);