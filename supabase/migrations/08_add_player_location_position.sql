/*
      # Add location and position to players table

      This migration adds columns to the `players` table to store their default location ('bench' or 'field') and position, primarily for use in the global lineup planning page.

      1. Changes
         - Add `location` column (text, default 'bench') to `players`.
         - Add `position` column (jsonb, nullable) to `players`.
      2. Security
         - The existing RLS policy for `players` already covers these new columns as it grants full access based on `team_id`. No policy changes needed.
    */

    -- Add location column with default
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'location'
      ) THEN
        ALTER TABLE public.players ADD COLUMN location text NOT NULL DEFAULT 'bench' CHECK (location IN ('field', 'bench'));
        COMMENT ON COLUMN public.players.location IS 'Default location for lineup planning (field or bench).';
      END IF;
    END $$;

    -- Add position column
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'position'
      ) THEN
        ALTER TABLE public.players ADD COLUMN position jsonb NULL;
        COMMENT ON COLUMN public.players.position IS 'Default position for lineup planning ({x, y} percentages).';
      END IF;
    END $$;