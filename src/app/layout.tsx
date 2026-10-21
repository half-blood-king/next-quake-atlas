import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: { default: 'Quake Atlas', template: '%s · Quake Atlas' },
  description: 'Live global earthquake activity rendered with React Server Components.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        {children}
        <footer className="foot">
          Data: <a href="https://earthquake.usgs.gov/earthquakes/feed/">USGS Earthquake Hazards Program</a> · Map:
          Natural Earth via world-atlas
        </footer>
      </body>
    </html>
  );
}
