import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PulseSMS — Enterprise Bulk SMS Platform',
  description: 'Production-grade enterprise SMS communications platform with real-time PostgreSQL analytics, zero vulnerabilities, campaigns, contacts, and live inbox.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-full antialiased overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
