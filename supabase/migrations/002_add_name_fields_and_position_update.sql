-- ServiceDraft.AI — Migration 002
-- Add first_name and last_name columns to users table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================
-- ADD NAME COLUMNS
-- ============================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name VARCHAR;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name VARCHAR;

-- ============================================
-- NOTE: Position field is now a dropdown in the UI
-- Valid values: Technician, Foreman, Diagnostician, Advisor, Manager, Warranty Clerk
-- The column type (VARCHAR) remains the same — enforcement is in the application layer.
-- ============================================

-- ============================================
-- NOTE: profile_picture_url column is kept for backward compatibility
-- but is no longer used by the application. Position-based icons are
-- displayed instead.
-- ============================================
