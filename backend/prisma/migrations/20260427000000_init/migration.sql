-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('seeker', 'host', 'admin');

-- CreateEnum
CREATE TYPE "SleepSchedule" AS ENUM ('early_bird', 'night_owl', 'flexible');

-- CreateEnum
CREATE TYPE "SmokingOption" AS ENUM ('yes', 'no', 'outside');

-- CreateEnum
CREATE TYPE "GuestsFrequency" AS ENUM ('rare', 'sometimes', 'often');

-- CreateEnum
CREATE TYPE "DietOption" AS ENUM ('any', 'vegetarian', 'vegan', 'halal');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'active', 'rented', 'archived');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('any', 'male', 'female');

-- CreateEnum
CREATE TYPE "BillCategory" AS ENUM ('rent', 'utilities', 'internet', 'cleaning', 'other');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'seeker',
    "avatar_url" TEXT,
    "bio" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "occupation" TEXT,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_id_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifestyle_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "sleep_schedule" "SleepSchedule",
    "cleanliness" INTEGER,
    "smoking" "SmokingOption",
    "pets_ok" BOOLEAN,
    "guests_frequency" "GuestsFrequency",
    "noise_tolerance" INTEGER,
    "diet" "DietOption",
    "has_pets" BOOLEAN,
    "work_from_home" BOOLEAN,

    CONSTRAINT "lifestyle_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" SERIAL NOT NULL,
    "host_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "monthly_rent" DECIMAL(12,2) NOT NULL,
    "deposit" DECIMAL(12,2),
    "total_rooms" INTEGER NOT NULL,
    "available_rooms" INTEGER NOT NULL,
    "current_occupants" INTEGER NOT NULL DEFAULT 0,
    "max_occupants" INTEGER NOT NULL,
    "pets_allowed" BOOLEAN NOT NULL DEFAULT false,
    "smoking_allowed" "SmokingOption",
    "gender_preference" "GenderPreference" NOT NULL DEFAULT 'any',
    "min_age" INTEGER,
    "max_age" INTEGER,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "internet_included" BOOLEAN NOT NULL DEFAULT false,
    "available_from" TIMESTAMP(3),
    "min_stay_months" INTEGER,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ListingStatus" NOT NULL DEFAULT 'draft',
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" SERIAL NOT NULL,
    "listing_id" INTEGER NOT NULL,
    "category" "BillCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "amount_kzt" DECIMAL(12,2) NOT NULL,
    "is_included_in_rent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_rules" (
    "id" SERIAL NOT NULL,
    "listing_id" INTEGER NOT NULL,
    "rule_text" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "house_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "listing_id" INTEGER NOT NULL,
    "seeker_id" INTEGER NOT NULL,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "listing_id" INTEGER NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "reviewee_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "filter_json" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_verifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "id_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lifestyle_profiles_user_id_key" ON "lifestyle_profiles"("user_id");

-- CreateIndex
CREATE INDEX "listings_city_district_idx" ON "listings"("city", "district");

-- CreateIndex
CREATE INDEX "listings_monthly_rent_deposit_idx" ON "listings"("monthly_rent", "deposit");

-- CreateIndex
CREATE INDEX "bills_listing_id_idx" ON "bills"("listing_id");

-- CreateIndex
CREATE INDEX "house_rules_listing_id_idx" ON "house_rules"("listing_id");

-- CreateIndex
CREATE INDEX "applications_seeker_id_status_idx" ON "applications"("seeker_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_listing_id_seeker_id_key" ON "applications"("listing_id", "seeker_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_listing_id_key" ON "favorites"("user_id", "listing_id");

-- CreateIndex
CREATE INDEX "reviews_reviewee_id_idx" ON "reviews"("reviewee_id");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE INDEX "id_verifications_user_id_status_idx" ON "id_verifications"("user_id", "status");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_profiles" ADD CONSTRAINT "lifestyle_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "house_rules" ADD CONSTRAINT "house_rules_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_verifications" ADD CONSTRAINT "id_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

