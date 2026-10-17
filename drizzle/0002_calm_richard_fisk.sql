ALTER TABLE "messages" ADD COLUMN "bot_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "handoff_bot_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_handoff_bot_id_bots_id_fk" FOREIGN KEY ("handoff_bot_id") REFERENCES "public"."bots"("id") ON DELETE set null ON UPDATE no action;