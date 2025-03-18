"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the VideoVerificationInterface component to avoid SSR issues
const VideoVerificationInterface = dynamic(
  () => import('@/components/VideoVerificationInterface'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading facial verification system...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment to initialize</p>
        </div>
      </div>
    )
  }
)

export default function Home() {
  return (
    <main>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading facial verification system...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a moment to initialize</p>
          </div>
        </div>
      }>
        <VideoVerificationInterface />
      </Suspense>
    </main>
  )
}

