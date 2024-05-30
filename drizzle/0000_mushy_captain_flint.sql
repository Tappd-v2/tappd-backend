CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"location_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(256) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category_id" integer NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"max_per_order" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"payment_id" varchar(256) NOT NULL,
	"table_id" integer NOT NULL,
	"state_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"remarks" varchar(256) NOT NULL,
	"receipt_url" varchar NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"location_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(256) NOT NULL,
	"password" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_id_index" ON "categories" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_id_index" ON "items" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_index" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "table_location_id_index" ON "tables" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_id_index" ON "users" ("email");