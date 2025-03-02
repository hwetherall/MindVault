import React from 'react';
import { Search } from '@mui/icons-material';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onGenerateInvestmentMemo: () => void;
  onClearRepository: () => void;
}

/**
 * Header component for the main layout
 */
const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  setSearchQuery,
  onGenerateInvestmentMemo,
  onClearRepository
}) => {
  return (
    <header className="bg-gray-800 shadow-md border-b border-gray-700 p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-white">MindVault</h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-full w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={onGenerateInvestmentMemo}
          >
            Create Investment Memo
          </button>
          
          <button
            className="px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded hover:bg-gray-600 transition-colors"
            onClick={onClearRepository}
          >
            Clear Repository
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 