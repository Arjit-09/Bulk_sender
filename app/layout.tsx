import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ZenithTech PaaS — Bulk SMS, WhatsApp & Email Platform (US & Canada)',
  description: 'Enterprise-grade omnichannel messaging platform. Dual Telnyx routing (Toll-Free & Local 10DLC), WhatsApp Business Suite, and high-deliverability email marketing.',
  keywords: 'bulk SMS, US SMS, Canada SMS, Telnyx Toll-Free, WhatsApp Business API, email campaigns, PaaS',
  openGraph: {
    title: 'ZenithTech PaaS — US & Canada Omnichannel Cloud',
    description: 'High-throughput Telnyx messaging, WhatsApp Business suite, and real-time inbox.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('zs-theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-full antialiased overflow-x-hidden`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
