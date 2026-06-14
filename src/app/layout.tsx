import { Outfit } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { NhostAppProvider } from '@/components/providers/NhostAppProvider';
import { siteMetadata } from '@/lib/site-metadata';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <NhostAppProvider>
            <AuthProvider>
              <ToastProvider>
                <SidebarProvider>{children}</SidebarProvider>
              </ToastProvider>
            </AuthProvider>
          </NhostAppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
