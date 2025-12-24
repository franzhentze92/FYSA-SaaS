-- Fix RLS policies for tienda tables
-- Run this script to update the policies if you're getting RLS errors
-- This allows operations without Supabase Auth (since the app uses custom auth)

-- Drop existing policies
DROP POLICY IF EXISTS "Products are insertable by authenticated admins" ON tienda_productos;
DROP POLICY IF EXISTS "Products are updatable by authenticated admins" ON tienda_productos;
DROP POLICY IF EXISTS "Products are deletable by authenticated admins" ON tienda_productos;
DROP POLICY IF EXISTS "Orders are viewable by authenticated admins" ON tienda_ordenes;
DROP POLICY IF EXISTS "Orders are updatable by authenticated admins" ON tienda_ordenes;

-- Create new policies that allow all operations
-- (Since the app uses custom authentication via localStorage)
CREATE POLICY "Products are insertable by everyone"
  ON tienda_productos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Products are updatable by everyone"
  ON tienda_productos FOR UPDATE
  USING (true);

CREATE POLICY "Products are deletable by everyone"
  ON tienda_productos FOR DELETE
  USING (true);

CREATE POLICY "Orders are viewable by everyone"
  ON tienda_ordenes FOR SELECT
  USING (true);

CREATE POLICY "Orders are updatable by everyone"
  ON tienda_ordenes FOR UPDATE
  USING (true);

