-- Add error_message column to render_jobs table
ALTER TABLE render_jobs 
ADD COLUMN error_message TEXT;

-- Add comment
COMMENT ON COLUMN render_jobs.error_message IS 'Error message if the job failed';
