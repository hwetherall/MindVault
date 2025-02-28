'use client';

import React, { useState } from 'react';

interface WelcomePopupProps {
  isVisible: boolean;
  onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isVisible, onClose }) => {
  const [showPopup, setShowPopup] = useState(isVisible);

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Welcome to MindVault</h2>
        <p className="mb-4">
          Your intelligent note-taking assistant powered by AI.
        </p>
        <p className="mb-4">
          To get started, upload a document or create a new note.
        </p>
        <button
          onClick={() => {
            setShowPopup(false);
            onClose();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomePopup; 