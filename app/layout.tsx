import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Navigation from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DeliverEase - Multi-Purpose Sales & Delivery Platform',
  description: 'Buy, sell, and deliver merchandise with GPS tracking. Connect sellers, drivers, and buyers in one platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
