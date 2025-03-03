import { supabase } from '../../app/lib/supabase';

export default async function handler(req, res) {
  // Ensure storage buckets exist
  await ensureStorageBuckets();

  if (req.method === 'GET') {
    try {
      // For RLS, we would usually need to verify the user's session here
      // But for simplicity, we'll just fetch all documents
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, file_path, file_type, file_size, content, structured_data, public_url } = req.body;

      // Validate required fields
      if (!title || !file_path || !file_type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // For RLS, we would normally get the user_id from the authenticated session
      // For simplicity, we're creating a public record that doesn't belong to any user
      // In a real app with RLS enabled, you would need to add the user_id field
      
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            title,
            file_path,
            file_type,
            file_size,
            content,
            structured_data,
            public_url,
            // Add this line if you have RLS enabled and have a user_id column
            // user_id: req.user.id 
          }
        ])
        .select();

      if (error) throw error;

      return res.status(201).json(data[0]);
    } catch (error) {
      console.error('Error creating document:', error);
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Missing document ID' });
      }

      // Get the file info to delete from storage
      const { data: fileData, error: fetchError } = await supabase
        .from('documents')
        .select('file_path, file_type')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (fileData) {
        // Determine the storage bucket based on file type
        const bucket = fileData.file_type.includes('spreadsheet') ? 'spreadsheets' : 'documents';
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([fileData.file_path]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting document:', error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
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