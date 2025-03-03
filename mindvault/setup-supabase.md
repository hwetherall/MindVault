# Setting up Supabase Storage for MindVault

This guide will help you set up the necessary storage buckets and database tables in Supabase for file storage in MindVault.

## 1. Database Setup

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query and paste the contents of `setup-db.sql` or copy the SQL below:

```sql
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

-- Create a public policy for easier testing
CREATE POLICY "Allow public access to documents" 
ON documents FOR ALL 
USING (true);

-- Enable RLS but with a public policy for easy testing
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

4. Run the query to create the necessary table

## 2. Storage Bucket Setup

1. Go to "Storage" in the left sidebar
2. Create two new buckets:
   - `documents` - For storing PDF files
   - `spreadsheets` - For storing Excel files
3. For both buckets, make sure to:
   - Set "Public Bucket" to ON for easier testing
   - Set "File Size Limit" to 20MB

## 3. Environment Variables

Make sure your `.env.local` file contains the necessary Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Testing the Setup

1. Start your application
2. Visit `/api/setup` to verify the database and storage buckets exist
3. Try uploading a file through the application
4. Check the Supabase dashboard to verify files are being stored correctly

## Troubleshooting

- **CORS Issues**: If you encounter CORS errors, make sure your Supabase project has the correct API settings. Go to API settings and add your application URL to the allowed origins.
- **Upload Errors**: Check browser console for detailed error messages. Common issues include missing buckets, file size limitations, or invalid file types.
- **Database Errors**: Verify the SQL script ran correctly by checking the table structure in the Table Editor view.

## Advanced Configuration

For production use, you should modify the RLS policies to restrict access based on authenticated users:

```sql
-- Replace the public policy with these:
DROP POLICY IF EXISTS "Allow public access to documents" ON documents;

CREATE POLICY "Users can view their own documents" 
ON documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON documents FOR DELETE 
USING (auth.uid() = user_id);
```

Note: You'll need to add a `user_id` column to the documents table and modify the application code to include the user's ID when inserting records. 

## Storage Bucket Policies

To ensure proper file uploads, you should set up the following policies for the storage buckets:

1. **Documents Bucket**:
   - Allow INSERT operations for uploads
   - Allow SELECT operations for retrieving files
   - Allow DELETE operations for deleting files

2. **Spreadsheets Bucket**:
   - Allow INSERT operations for uploads
   - Allow SELECT operations for retrieving files
   - Allow DELETE operations for deleting files

For testing purposes, you can temporarily set very permissive policies:

```sql
CREATE POLICY "Allow public access" 
ON storage.objects
FOR ALL
TO public
USING (true);
```

## CORS Configuration

To resolve CORS issues, you should configure the CORS settings for your Supabase project:

1. Go to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to "Storage" in the left sidebar
4. Click on "Policies"
5. Click on "CORS Configurations" at the top
6. Add the following configuration:
   ```
   {
     "origin": "*",
     "methods": ["GET", "POST", "PUT", "DELETE"],
     "headers": ["Content-Type", "Authorization"],
     "maxAgeSeconds": 3600
   }
   ```

## Next Steps

After implementing these changes, try uploading files again. The improved error handling should now show you the specific error messages from Supabase, which will help pinpoint the exact issue.

If you're still encountering problems, please share the detailed error messages that you now see, and I can provide more targeted assistance. 