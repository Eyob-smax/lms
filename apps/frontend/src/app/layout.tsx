import type { Metadata } from 'next';
import { Geist, Inter } from 'next/font/google';
import './globals.css';
import ReactQueryProvider from './providers';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LMS Enterprise | BPO Training & Management Portal',
  description:
    'Enterprise-grade Learning Management System designed for BPO onboarding, agent evaluation, AI course authoring, and compliance metrics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-background font-inter antialiased min-h-screen">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
