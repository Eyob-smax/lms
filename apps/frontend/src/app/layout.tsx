import { Geist, Inter } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable}`}>
      <head>
        <title key="title">LMS Enterprise | BPO Training & Management Portal</title>
        <meta
          key="desc"
          name="description"
          content="Enterprise-grade Learning Management System designed for BPO onboarding, agent evaluation, AI course authoring, and compliance metrics."
        />
        <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-background text-on-background font-inter antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
