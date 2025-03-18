import type { ReactNode } from "react"
import './globals.css'

export const metadata = {
  title: 'FaceVerify',
  description: 'Video verification interface',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
} 