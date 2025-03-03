import React from 'react';
import Image from 'next/image';
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
    <header className="bg-white shadow-md border-b-2 border-border-medium p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="flex items-center">
            <Image
              src="/innovera-logo.svg"
              alt="Innovera Logo"
              width={120}
              height={30}
              priority
            />
            <div className="ml-2 flex items-center">
              <span className="text-primary font-bold">A</span>
              <span className="text-secondary font-bold">I</span>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search notes..."
              className="pl-10 pr-4 py-2 bg-background-secondary border-2 border-border-medium text-text-primary rounded-full w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            className="innovera-button-primary"
            onClick={onGenerateInvestmentMemo}
          >
            Create Investment Memo
          </button>
          
          <button
            className="innovera-button-secondary"
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