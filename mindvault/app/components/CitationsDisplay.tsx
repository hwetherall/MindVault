import React, { useState } from 'react';
import { FileText, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';

interface Citation {
  fileId: string;
  filename: string;
  text: string;
}

interface CitationsDisplayProps {
  citations: Citation[];
}

/**
 * Component to display file citations from AI responses
 */
const CitationsDisplay: React.FC<CitationsDisplayProps> = ({ citations }) => {
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
  
  if (!citations || citations.length === 0) {
    return null;
  }
  
  // Group citations by filename
  const groupedCitations = citations.reduce((acc, citation) => {
    // Use a default filename if none is provided
    const filename = citation.filename || 'Unknown file';
    
    if (!acc[filename]) {
      acc[filename] = [];
    }
    acc[filename].push(citation);
    return acc;
  }, {} as Record<string, Citation[]>);
  
  const toggleCitation = (filename: string) => {
    if (expandedCitation === filename) {
      setExpandedCitation(null);
    } else {
      setExpandedCitation(filename);
    }
  };
  
  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Sources</h3>
      <div className="space-y-2">
        {Object.entries(groupedCitations).map(([filename, fileCitations]) => (
          <div key={filename} className="border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="p-3 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100"
              onClick={() => toggleCitation(filename)}
            >
              <div className="flex items-center">
                {filename.toLowerCase().endsWith('.pdf') ? (
                  <FileText size={16} className="text-red-500 mr-2" />
                ) : (
                  <FileSpreadsheet size={16} className="text-green-500 mr-2" />
                )}
                <span className="text-sm font-medium">{filename}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({fileCitations.length} {fileCitations.length === 1 ? 'citation' : 'citations'})
                </span>
              </div>
              {expandedCitation === filename ? (
                <ChevronUp size={16} className="text-gray-500" />
              ) : (
                <ChevronDown size={16} className="text-gray-500" />
              )}
            </div>
            
            {expandedCitation === filename && (
              <div className="p-3 border-t border-gray-200 bg-white">
                <div className="text-xs text-gray-700 space-y-2">
                  {fileCitations.map((citation, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <div className="italic">"...{citation.text}..."</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitationsDisplay;