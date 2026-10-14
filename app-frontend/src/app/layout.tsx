import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastContainer } from '@/components/toast/ToastContainer';
import { MockProvider } from '@/components/MockProvider';

export const metadata: Metadata = {
  title: 'Transaction Import',
  description: 'Import, check and approve daily bank transaction files',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          <div className="min-h-screen">
            <MockProvider>{children}</MockProvider>
          </div>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
