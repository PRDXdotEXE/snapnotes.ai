ALTER TABLE "refresh_tokens" ADD COLUMN "jti" text NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_jti_key" UNIQUE("jti");