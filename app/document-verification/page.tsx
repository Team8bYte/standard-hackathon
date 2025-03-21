"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DocumentVerification from "@/components/DocumentVerification"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getCurrentUser } from "@/lib/user-data"

export default function DocumentVerificationPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const user = getCurrentUser()
    if (!user) {
      // Redirect to the home page if not authenticated
      router.push('/')
    } else {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center">
          <p className="text-lg mb-4">You need to be authenticated to access this page.</p>
          <Button onClick={() => router.push('/')}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <DocumentVerification />
    </div>
  )
} 