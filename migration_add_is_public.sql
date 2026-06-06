-- Migration: add is_public column to roles table
-- Run this SQL in your Supabase SQL editor (Dashboard > SQL Editor)

ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false NOT NULL;

-- Set professeur and etudiant as public by default (visible on signup page)
UPDATE roles SET is_public = true WHERE name IN ('professeur', 'etudiant');

-- admin and other system roles remain private (is_public = false)
