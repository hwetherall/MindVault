import './globals.css';
import { NotesProvider } from './context/NotesContext';
import { AIProvider } from './context/AIContext';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export const metadata = {
  title: 'MindVault',
  description: 'Your intelligent note-taking assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NotesProvider>
          <AIProvider>
            {children}
            <SpeedInsights />
            <Analytics />
          </AIProvider>
        </NotesProvider>
      </body>
    </html>
  );
} 