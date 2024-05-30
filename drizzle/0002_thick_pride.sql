CREATE TABLE IF NOT EXISTS "call_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_id" integer NOT NULL,
	"state_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"amount" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "user_id_index";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "table_id_index" ON "call_requests" ("table_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "state_id_index" ON "call_requests" ("state_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorite_item_id_index" ON "favorites" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorite_user_id_index" ON "favorites" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_name_index" ON "locations" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_id_index" ON "order_items" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_id_index" ON "order_items" ("item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "state_name_index" ON "states" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_user_id_index" ON "orders" ("user_id");