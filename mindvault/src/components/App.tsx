import React from 'react';
import { NotesProvider } from '../context/NotesContext';
import { AIProvider } from '../context/AIContext';
import MainLayout from './MainLayout';

export default function App() {
  return (
    <NotesProvider>
      <AIProvider>
        <MainLayout />
      </AIProvider>
    </NotesProvider>
  );
} 