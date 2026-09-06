import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pickwise-product-showdown.abuzz-fig-0249.chatgpt.site'),
  title: 'Pickwise — Product Comparison Voting',
  description: 'Compare two products feature by feature and see live community results.',
  openGraph: {
    title: 'Pickwise — Every feature. One clear winner.',
    description: 'Compare two products, feature by feature.',
    images: [{ url: '/og.png', width: 1714, height: 910, alt: 'Pickwise product comparison' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pickwise — Every feature. One clear winner.',
    description: 'Compare two products, feature by feature.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
