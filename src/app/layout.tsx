import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'classroom planner',
  description: 'Generate calssroom seating plans',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        
      </head>
      <body className={inter.className}>
        {children}
        <footer>
          ©Classroom 2025. Created with ❤️ and ✨ by <a href="https://stenstudio.vercel.app/">StenStudio</a>.
        </footer>
      </body>
    </html>
  )
}
