import type { Metadata } from 'next';
import './globals.css';
import { ApolloWrapper } from '@/components/apollo/ApolloWrapper';
import { Navbar } from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'FinFlow',
  description: 'Financial Operations Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[oklch(0.12_0.01_250)] text-white">
        <ApolloWrapper>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </ApolloWrapper>
      </body>
    </html>
  );
}
