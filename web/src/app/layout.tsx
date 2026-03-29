import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import Sidebar from '../components/Sidebar';
import { ToastProvider } from '../components/Toast';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'File Search Store — Dashboard',
  description: 'Manage your Gemini File Search Stores',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased flex bg-[var(--bg-primary)]">
        <ToastProvider>
          <Sidebar />
          <main className="flex-1 min-h-screen p-4 pt-16 md:px-8 md:py-8 md:ml-60">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
