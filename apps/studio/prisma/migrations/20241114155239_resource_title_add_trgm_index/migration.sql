-- Enable the pg_trgm extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the GIN index on the "title" column of the "Resource" table
CREATE INDEX "resource_title_trgm_idx" ON "Resource" USING GIN ("title" gin_trgm_ops);
