import type { Metadata } from 'next'
import Navbar from '@/components/navbar'
import { TimeProvider } from '@/context/time'

export const metadata: Metadata = {
  title: 'RestaurantOS',
  description: 'Restaurant management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5' }}>
        <TimeProvider>
          <Navbar />
          <main style={{ padding: '30px 40px' }}>
            {children}
          </main>
        </TimeProvider>
      </body>
    </html>
  )
}
