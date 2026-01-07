-- Add category column to tasks table
\c task_manager;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';

-- Add check constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tasks_category_check'
    ) THEN
        ALTER TABLE tasks ADD CONSTRAINT tasks_category_check 
        CHECK (category IN ('household', 'work', 'health', 'personal', 'finance', 'education', 'social', 'general'));
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'category';
