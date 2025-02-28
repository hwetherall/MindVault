import { supabase } from '../lib/supabase';

export const notesService = {
  async createNote(title, content) {
    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          title,
          content,
        },
      ])
      .select();

    if (error) throw error;
    return data;
  },

  async getNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async deleteAllNotes() {
    const { error } = await supabase
      .from('notes')
      .delete()
      .not('id', 'is', null); // This deletes all records

    if (error) throw error;
  },

  async deleteNote(noteId) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },
};