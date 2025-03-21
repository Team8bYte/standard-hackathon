"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import VideoGuidance from "@/components/VideoGuidance"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Maximize2, Minimize2, HelpCircle, Keyboard } from "lucide-react"
import { getCurrentUser } from "@/lib/user-data"

export default function ManagerDashboard() {
  const router = useRouter()
  const [fullWidth, setFullWidth] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Check for authentication
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
  
  // Add keyboard shortcut listener
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in a text field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // F key for toggling fullWidth
      if (e.key === 'f' || e.key === 'F') {
        setFullWidth(prev => !prev);
      }
      
      // ? key for showing keyboard shortcuts
      if (e.key === '?') {
        setShowShortcuts(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
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
    <div className={`container mx-auto py-8 ${fullWidth ? 'max-w-full px-4' : 'max-w-7xl'}`}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Loan Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1">Complete the training modules to understand loan processes</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            title="Show keyboard shortcuts (Press ?)"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullWidth(!fullWidth)}
            title={fullWidth ? "Switch to normal width (Press F)" : "Switch to full width (Press F)"}
          >
            {fullWidth ? (
              <><Minimize2 className="h-4 w-4 mr-2" /> Normal Width</>
            ) : (
              <><Maximize2 className="h-4 w-4 mr-2" /> Full Width</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
      
      <VideoGuidance fullWidth={fullWidth} showKeyboardShortcuts={showShortcuts} onShortcutsChange={setShowShortcuts} />
      
      {/* Keyboard shortcuts tip */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          <Keyboard className="h-3 w-3" />
          <span>Tip: Press</span>
          <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">?</kbd>
          <span>to view keyboard shortcuts</span>
        </p>
      </div>
    </div>
  )
}
