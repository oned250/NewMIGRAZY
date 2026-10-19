import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Ryokourent V2 — Lacak Unit & Kalkulator Denda ShortRent',
  description:
    'Audit penyelesaian migrasi Ryokourent v2 (D-26 & D-27): CPT Lacak Unit (Pool Parkir, Bengkel Servis, Posisi Sewa) & Kalkulator Denda ShortRent Step-Up 60 Menit.',
  openGraph: {
    title: 'Ryokourent V2 — Lacak Unit & Kalkulator Denda ShortRent',
    description:
      'Audit penyelesaian migrasi Ryokourent v2 (D-26 & D-27): CPT Lacak Unit (Pool Parkir, Bengkel Servis, Posisi Sewa) & Kalkulator Denda ShortRent Step-Up 60 Menit.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ryokourent V2 — Lacak Unit & Kalkulator Denda ShortRent',
    description:
      'Audit penyelesaian migrasi Ryokourent v2 (D-26 & D-27): CPT Lacak Unit (Pool Parkir, Bengkel Servis, Posisi Sewa) & Kalkulator Denda ShortRent Step-Up 60 Menit.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
