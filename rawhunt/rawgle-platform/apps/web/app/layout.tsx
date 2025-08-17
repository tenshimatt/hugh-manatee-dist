// Main App Layout
import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@/components/analytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Rawgle - Premium Raw Dog Food Community',
  description: 'Connect with raw feeding enthusiasts, find trusted suppliers, get personalized recommendations, and learn everything about raw feeding your dog.',
  keywords: 'raw dog food, BARF diet, prey model raw, dog nutrition, raw feeding community',
  openGraph: {
    title: 'Rawgle - Premium Raw Dog Food Community',
    description: 'The ultimate platform for raw dog food enthusiasts',
    images: ['/og-image.png'],
    url: 'https://rawgle.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rawgle - Premium Raw Dog Food Community',
    description: 'The ultimate platform for raw dog food enthusiasts',
    images: ['/twitter-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
