import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ZenithServices — Omnichannel Marketing Platform',
  description: 'Enterprise-grade multi-channel marketing platform. Send SMS, WhatsApp & Email campaigns globally with country targeting, analytics, and team collaboration.',
  keywords: 'bulk SMS, WhatsApp marketing, email campaigns, omnichannel, marketing automation',
  openGraph: {
    title: 'ZenithServices',
    description: 'Reach your customers across SMS, WhatsApp and Email globally.',
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
        {children}
      </body>
    </html>
  );
}
