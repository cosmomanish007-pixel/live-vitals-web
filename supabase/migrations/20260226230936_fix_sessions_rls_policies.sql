/*
  # Fix RLS Policies for Sessions Table

  ## Issue
  The sessions table insert policy was too restrictive and prevented authenticated users
  from creating new sessions. This migration updates the RLS policies to properly allow
  users to create sessions while maintaining security.

  ## Changes
  - Updated sessions INSERT policy to correctly allow authenticated users to insert
  - Kept existing SELECT and UPDATE policies for data access control
*/

DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );