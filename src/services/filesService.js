import { supabase } from '../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

export const filesService = {
  async extractTextFromPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Could not extract text from PDF');
    }
  },

  async uploadFile(file, title) {
    try {
      // 1. Extract text if it's a PDF
      let textContent = null;
      if (file.type === 'application/pdf') {
        textContent = await this.extractTextFromPDF(file);
        console.log('Extracted text:', textContent?.substring(0, 100)); // Debug log
      }

      // 2. Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError, data: storageData } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // 3. Create database record
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            title: title || file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
            content: textContent,
            public_url: publicUrl
          }
        ])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  async getFiles() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(file => ({
      id: file.id,
      name: file.title,
      type: file.file_type,
      content: file.content,
      url: file.public_url
    }));
  },

  async deleteFile(fileId) {
    try {
      // First get the file info to get the storage path
      const { data: file } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (file) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([file.file_path]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};