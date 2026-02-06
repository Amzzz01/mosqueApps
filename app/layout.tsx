import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Masjid Al-Falah - Sistem Pengurusan Masjid',
  description: 'Sistem pengurusan masjid yang komprehensif untuk Masjid Al-Falah',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
