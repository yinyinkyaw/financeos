import type { Metadata, Viewport } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from '@/lib/brand';

import './globals.css';

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const _ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-mono',
});

export const metadata: Metadata = {
  title: {
    default: PRODUCT_NAME,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: PRODUCT_DESCRIPTION,
  applicationName: PRODUCT_NAME,
  category: 'finance',
  keywords: ['personal ledger', 'cash-flow planner', 'expense tracking', 'personal finance'],
  openGraph: {
    type: 'website',
    title: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
    siteName: PRODUCT_NAME,
  },
  icons: {
    icon: [{ url: '/financeos-mark.svg', type: 'image/svg+xml' }],
    shortcut: '/financeos-mark.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#168064',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${_inter.variable} ${_ibmPlexMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
