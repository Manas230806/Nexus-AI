import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '../components/ThemeProvider';
import { CallProvider } from '../contexts/CallContext';

export const metadata: Metadata = {
  title: 'Nexus AI',
  description: 'AI-powered real-time team collaboration platform.',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
  icons: {
    icon: '/logo-light.png',
    shortcut: '/logo-light.png',
    apple: '/logo-light.png'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <CallProvider>
            {children}
          </CallProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
