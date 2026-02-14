import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import Sidebar from '../components/Sidebar';
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
      <body className="font-sans antialiased">
        <Sidebar />
        <main className="ml-[240px] min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
