import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import PedramExport from './PedramExport';

interface PedramExportCardProps {
  files: any[];
  isCollapsed?: boolean;
}

export const PedramExportCard: React.FC<PedramExportCardProps> = ({ files, isCollapsed = false }) => {
  const [showExport, setShowExport] = useState(false);

  // Don't render the button when collapsed
  if (isCollapsed) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowExport(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <FileDown size={16} />
        Pedram Analysis
      </button>

      {showExport && (
        <PedramExport
          files={files}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  );
};

export default PedramExportCard; 