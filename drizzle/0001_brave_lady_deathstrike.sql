ALTER TABLE "orders" ALTER COLUMN "state_id" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "remarks" DROP NOT NULL;