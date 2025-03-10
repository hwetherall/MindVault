import { supabase } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if the documents table exists
    const { error: queryError } = await supabase
      .from('documents')
      .select('id')
      .limit(1);
    
    // If we get a specific error about the table not existing, create it
    if (queryError && queryError.code === '42P01') {
      // Table doesn't exist, create it using SQL
      const { error: createError } = await supabase.rpc('create_documents_table');
      
      if (createError) {
        console.error('Error creating documents table:', createError);
        return NextResponse.json({ error: 'Failed to create documents table' }, { status: 500 });
      }
      
      return NextResponse.json({ message: 'Documents table created successfully' });
    } else if (queryError) {
      // Some other error occurred
      console.error('Error checking documents table:', queryError);
      return NextResponse.json({ error: 'Error checking documents table' }, { status: 500 });
    }
    
    // Create stored procedure to create table if it doesn't exist
    const createProcedure = `
      CREATE OR REPLACE FUNCTION create_documents_table()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
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
        
        -- Add extension if it doesn't exist
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      END;
      $$;
    `;
    
    const { error: procedureError } = await supabase.rpc('create_procedure', { 
      sql: createProcedure 
    });
    
    if (procedureError) {
      console.error('Error creating procedure:', procedureError);
      
      // Try direct SQL approach
      const { error: sqlError } = await supabase.rpc('create_documents_table');
      
      if (sqlError) {
        console.error('Error with direct SQL approach:', sqlError);
        return NextResponse.json({ 
          message: 'Database exists but could not create helper procedure',
          error: procedureError.message
        }, { status: 200 });
      }
    }
    
    // Create storage buckets
    await ensureStorageBuckets();
    
    return NextResponse.json({ message: 'Database setup complete' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Ensures that the required storage buckets exist
 */
async function ensureStorageBuckets() {
  try {
    // Check if buckets API is available
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    // Check for documents bucket
    const documentsBucket = buckets.find(b => b.name === 'documents');
    if (!documentsBucket) {
      const { error } = await supabase.storage.createBucket('documents', {
        public: true,
        fileSizeLimit: 20971520, // 20MB
      });
      
      if (error) console.error('Error creating documents bucket:', error);
      else console.log('Created documents bucket');
    }
    
    // Check for spreadsheets bucket
    const spreadsheetsBucket = buckets.find(b => b.name === 'spreadsheets');
    if (!spreadsheetsBucket) {
      const { error } = await supabase.storage.createBucket('spreadsheets', {
        public: true,
        fileSizeLimit: 20971520, // 20MB
      });
      
      if (error) console.error('Error creating spreadsheets bucket:', error);
      else console.log('Created spreadsheets bucket');
    }
  } catch (error) {
    console.error('Error checking/creating buckets:', error);
  }
} 