import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nablijven Systeem',
  description: 'Systeem voor het beheren van nablijven op school',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
