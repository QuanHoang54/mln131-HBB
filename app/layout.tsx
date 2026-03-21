import type { Metadata } from 'next'
import { Source_Serif_4, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Serif font for headings - academic style
const sourceSerif = Source_Serif_4({ 
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  display: "swap",
});

// Sans font for body text
const inter = Inter({ 
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Chủ nghĩa xã hội khoa học',
  description: 'Bài thuyết trình về Chủ nghĩa xã hội khoa học - Một trang web học thuật dành cho sinh viên',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${sourceSerif.variable} ${inter.variable} scroll-smooth`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
