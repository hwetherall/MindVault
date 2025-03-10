import React from 'react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onGenerateInvestmentMemo: () => void;
  onClearRepository: () => void;
}

/**
 * Header component for the main layout - now empty as per design change
 */
const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  setSearchQuery,
  onGenerateInvestmentMemo,
  onClearRepository
}) => {
  // Return an empty div as we're removing the header
  return <div></div>;
};

export default Header; 