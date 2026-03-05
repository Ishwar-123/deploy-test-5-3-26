-- Add preview page columns to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS previewStartPage INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS previewEndPage INTEGER DEFAULT 2;

-- Update existing books to have default preview pages
UPDATE books 
SET previewStartPage = 1, previewEndPage = 2 
WHERE previewStartPage IS NULL OR previewEndPage IS NULL;
