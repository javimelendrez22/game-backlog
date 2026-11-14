CREATE TYPE "game_status" AS ENUM('wishlist', 'backlog', 'playing', 'completed', 'dropped');--> statement-breakpoint
CREATE TYPE "platform" AS ENUM('pc', 'playstation-4', 'playstation-5', 'nintendo-switch', 'nintendo-switch-2', 'mobile');--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(200) NOT NULL,
	"platforms" "platform"[] NOT NULL,
	"genres" text[] DEFAULT '{}'::text[] NOT NULL,
	"developer" varchar(200),
	"publisher" varchar(200),
	"release_date" date,
	"cover_image_url" text,
	"status" "game_status" DEFAULT 'backlog'::"game_status" NOT NULL,
	"rating" smallint,
	"hours_played" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_platforms_not_empty" CHECK (cardinality("platforms") >= 1),
	CONSTRAINT "games_rating_range" CHECK ("rating" between 1 and 10),
	CONSTRAINT "games_hours_played_non_negative" CHECK ("hours_played" >= 0)
);
--> statement-breakpoint
CREATE INDEX "games_status_idx" ON "games" ("status");