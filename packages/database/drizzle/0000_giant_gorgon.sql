CREATE TYPE "public"."activity_type" AS ENUM('viewed', 'tutorial_viewed', 'started', 'saved', 'unsaved');--> statement-breakpoint
CREATE TYPE "public"."cost_category" AS ENUM('free', 'free_early', 'free_testnet', 'free_quest', 'low_cost', 'paid');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('discovered', 'watching', 'under_review', 'approved', 'rejected', 'published', 'ending_soon', 'ended', 'claim_live');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'valid', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."security_event_type" AS ENUM('auth_failure', 'rate_limit_triggered', 'invalid_origin');--> statement-breakpoint
CREATE TABLE "airdrop_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutorial_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"instruction_ar" text NOT NULL,
	"instruction_en" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "airdrop_steps_position_positive_check" CHECK ("airdrop_steps"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "airdrop_tutorials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airdrop_id" uuid NOT NULL,
	"title_ar" varchar(180) NOT NULL,
	"title_en" varchar(180) NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "airdrops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"status" "opportunity_status" DEFAULT 'under_review' NOT NULL,
	"title_ar" varchar(160) NOT NULL,
	"title_en" varchar(160) NOT NULL,
	"summary_ar" text NOT NULL,
	"summary_en" text NOT NULL,
	"network" varchar(80),
	"cost" "cost_category" NOT NULL,
	"risk" "risk_level" DEFAULT 'unknown' NOT NULL,
	"difficulty" "difficulty_level" DEFAULT 'medium' NOT NULL,
	"estimated_minutes" smallint,
	"arkheon_score" smallint,
	"is_demo" boolean DEFAULT false NOT NULL,
	"official_url" text,
	"verified_referral_url" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "airdrops_score_range_check" CHECK ("airdrops"."arkheon_score" is null or ("airdrops"."arkheon_score" >= 0 and "airdrops"."arkheon_score" <= 100)),
	CONSTRAINT "airdrops_minutes_positive_check" CHECK ("airdrops"."estimated_minutes" is null or "airdrops"."estimated_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"reason" varchar(80) NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "points_ledger_nonzero_check" CHECK ("points_ledger"."points" <> 0)
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inviter_user_id" uuid NOT NULL,
	"invitee_user_id" uuid NOT NULL,
	"referral_code" varchar(24) NOT NULL,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"validated_at" timestamp with time zone,
	CONSTRAINT "referrals_no_self_check" CHECK ("referrals"."inviter_user_id" <> "referrals"."invitee_user_id")
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "security_event_type" NOT NULL,
	"request_id" uuid NOT NULL,
	"route" varchar(160) NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"init_data_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_airdrop_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"airdrop_id" uuid,
	"type" "activity_type" NOT NULL,
	"idempotency_key" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_saved_airdrops" (
	"user_id" uuid NOT NULL,
	"airdrop_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" varchar(64),
	"first_name" varchar(128) NOT NULL,
	"last_name" varchar(128),
	"language_code" varchar(16),
	"referral_code" varchar(24) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "airdrop_steps" ADD CONSTRAINT "airdrop_steps_tutorial_id_airdrop_tutorials_id_fk" FOREIGN KEY ("tutorial_id") REFERENCES "public"."airdrop_tutorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "airdrop_tutorials" ADD CONSTRAINT "airdrop_tutorials_airdrop_id_airdrops_id_fk" FOREIGN KEY ("airdrop_id") REFERENCES "public"."airdrops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_inviter_user_id_users_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_invitee_user_id_users_id_fk" FOREIGN KEY ("invitee_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_sessions" ADD CONSTRAINT "telegram_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_airdrop_activity" ADD CONSTRAINT "user_airdrop_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_airdrop_activity" ADD CONSTRAINT "user_airdrop_activity_airdrop_id_airdrops_id_fk" FOREIGN KEY ("airdrop_id") REFERENCES "public"."airdrops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_airdrops" ADD CONSTRAINT "user_saved_airdrops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_airdrops" ADD CONSTRAINT "user_saved_airdrops_airdrop_id_airdrops_id_fk" FOREIGN KEY ("airdrop_id") REFERENCES "public"."airdrops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "airdrop_steps_tutorial_position_uidx" ON "airdrop_steps" USING btree ("tutorial_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "airdrop_tutorials_airdrop_uidx" ON "airdrop_tutorials" USING btree ("airdrop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "airdrops_slug_uidx" ON "airdrops" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "airdrops_feed_idx" ON "airdrops" USING btree ("status","cost","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "points_ledger_idempotency_uidx" ON "points_ledger" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "points_ledger_user_created_idx" ON "points_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_invitee_uidx" ON "referrals" USING btree ("invitee_user_id");--> statement-breakpoint
CREATE INDEX "referrals_inviter_idx" ON "referrals" USING btree ("inviter_user_id");--> statement-breakpoint
CREATE INDEX "security_events_type_created_idx" ON "security_events" USING btree ("type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_sessions_token_hash_uidx" ON "telegram_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "telegram_sessions_init_data_hash_idx" ON "telegram_sessions" USING btree ("init_data_hash");--> statement-breakpoint
CREATE INDEX "telegram_sessions_user_idx" ON "telegram_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "telegram_sessions_expiry_idx" ON "telegram_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_activity_idempotency_uidx" ON "user_airdrop_activity" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "user_activity_user_created_idx" ON "user_airdrop_activity" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "user_activity_airdrop_idx" ON "user_airdrop_activity" USING btree ("airdrop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_airdrops_user_airdrop_uidx" ON "user_saved_airdrops" USING btree ("user_id","airdrop_id");--> statement-breakpoint
CREATE INDEX "user_saved_airdrops_airdrop_idx" ON "user_saved_airdrops" USING btree ("airdrop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_telegram_id_uidx" ON "users" USING btree ("telegram_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_code_uidx" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "users_last_seen_idx" ON "users" USING btree ("last_seen_at");