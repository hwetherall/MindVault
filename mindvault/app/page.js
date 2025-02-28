'use client';

import { useState, useEffect } from 'react';
import MainLayout from './components/MainLayout';
import { notesService } from './services/notesService';

export default function Home() {
  const [notes, setNotes] = useState([]);
  
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const fetchedNotes = await notesService.getNotes();
        setNotes(fetchedNotes);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };
    
    fetchNotes();
  }, []);

  return (
    <main className="flex min-h-screen flex-col">
      <MainLayout notes={notes} />
    </main>
  );
} 