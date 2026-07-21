import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { LayoutWrapper } from '@/components/website/LayoutWrapper'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
  title: 'AegisOps AI — Real-Time Hospital Operations Command Center',
  description: 'Real-time AI-powered hospital operations and resource management.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
    shortcut: '/favicon.png',
  },
  openGraph: {
    title: 'AegisOps AI — Real-Time Hospital Operations Command Center',
    description: 'Real-time AI-powered hospital operations command center.',
    images: [{ url: '/logo.png' }],
  },
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', fontSize: '14px' }
          }}
        />
      </body>
    </html>
  )
}
