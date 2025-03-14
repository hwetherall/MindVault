import React from 'react';

interface FastModeToggleProps {
  fastMode: boolean;
  setFastMode: (mode: boolean) => void;
}

/**
 * Toggle component for switching between normal and fast response modes
 */
const FastModeToggle: React.FC<FastModeToggleProps> = ({ fastMode, setFastMode }) => {
  return (
    <div className="flex items-center gap-2 my-2">
      <button
        onClick={() => setFastMode(!fastMode)}
        className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
          fastMode 
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        }`}
        aria-pressed={fastMode}
        title={fastMode ? "Fast mode: Quick answers but less thorough" : "Normal mode: More detailed and thorough analysis"}
      >
        <span>{fastMode ? 'Fast Mode' : 'Normal Mode'}</span>
      </button>
      
      <div className="text-xs text-gray-500">
        {fastMode 
          ? 'Quicker responses, may be less thorough'
          : 'More detailed analysis, may take longer'
        }
      </div>
    </div>
  );
};

export default FastModeToggle; 