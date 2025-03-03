-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  content TEXT,
  structured_data JSONB,
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select their own documents
CREATE POLICY "Users can view their own documents" 
ON documents FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for authenticated users to insert their own documents
CREATE POLICY "Users can insert their own documents" 
ON documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for authenticated users to update their own documents
CREATE POLICY "Users can update their own documents" 
ON documents FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for authenticated users to delete their own documents
CREATE POLICY "Users can delete their own documents" 
ON documents FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to automatically set updated_at on document update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- If you're not using RLS and want to allow public access, use this instead:
-- CREATE POLICY "Allow public access to documents" 
-- ON documents FOR ALL 
-- USING (true);

-- Comment to explain the additional steps needed
COMMENT ON TABLE documents IS 'Stores document metadata and content. You also need to create two storage buckets: "documents" and "spreadsheets" in the Supabase Storage section.'; 