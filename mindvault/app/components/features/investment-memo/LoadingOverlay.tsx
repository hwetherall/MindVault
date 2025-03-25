import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="p-4 rounded-lg bg-white shadow-lg flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <div className="mt-4 text-white font-medium">Loading...</div>
      </div>
    </div>
  );
}; 