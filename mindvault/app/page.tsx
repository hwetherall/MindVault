/**
 * Main application page
 */
'use client';

import React from 'react';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <MainLayout />
    </ErrorBoundary>
  );
} 