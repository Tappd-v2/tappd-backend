ALTER TABLE "call_requests" RENAME COLUMN "state_id" TO "state";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "state_id" TO "state";--> statement-breakpoint
DROP INDEX IF EXISTS "state_id_index";--> statement-breakpoint
ALTER TABLE "call_requests" ALTER COLUMN "state" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "call_requests" ALTER COLUMN "state" SET DEFAULT 'new';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "state" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "state" SET DEFAULT 'new';