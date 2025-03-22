"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, Mic, StopCircle, SkipForward, Loader2, AlertTriangle, MessageSquare, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Define the segments with their questions and video paths
const SEGMENTS = [
  {
    id: 1,
    title: "Employment Status",
    question: "Are you salaried or self-employed?",
    videoPath: "/videos/segments/v1.mp4",
    timestamp: "0:00",
    description: "Verify your employment type and status"
  },
  {
    id: 2,
    title: "Loan Details",
    question: "What loan amount are you requesting and for what tenure?",
    videoPath: "/videos/segments/v2.mp4",
    timestamp: "1:00",
    description: "Specify your desired loan amount and duration"
  },
  {
    id: 3,
    title: "Collateral Information",
    question: "Do you have a secured property asset to provide as collateral?",
    videoPath: "/videos/segments/v3.mp4",
    timestamp: "2:00",
    description: "Information about your collateral assets"
  },
  {
    id: 4,
    title: "Documentation",
    question: "Do you have last 6 months bank statement with ITR?",
    videoPath: "/videos/segments/v4.mp4",
    timestamp: "3:00",
    description: "Required documents for loan processing"
  },
  {
    id: 5,
    title: "Income Assessment",
    question: "Are you applying for a loan amount that exceeds 50% of your income?",
    videoPath: "/videos/segments/v5.mp4",
    timestamp: "4:00",
    description: "Evaluate your income to loan ratio"
  },
  {
    id: 6,
    title: "Monthly Income",
    question: "What is your monthly income?",
    videoPath: "/videos/segments/v6.mp4",
    timestamp: "5:00",
    description: "Details about your monthly earnings"
  },
  {
    id: 7,
    title: "AI Assistant",
    question: "Would you like to chat with ILLMATIC, your AI Loan Manager?",
    videoPath: "/videos/segments/v7.mp4",
    timestamp: "6:00",
    description: "Get personalized assistance from ILLMATIC"
  }
];

interface VideoGuidanceProps {
  fullWidth?: boolean;
  showKeyboardShortcuts?: boolean;
  onShortcutsChange?: (show: boolean) => void;
}

export default function VideoGuidance({ 
  fullWidth = false,
  showKeyboardShortcuts = false,
  onShortcutsChange
}: VideoGuidanceProps) {
  const [currentSegment, setCurrentSegment] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loanEligibility, setLoanEligibility] = useState({
    employmentType: "",
    hasCollateral: false,
    hasDocuments: false,
    exceedsIncomeCap: false,
    monthlyIncome: 0,
    tenure: 0
  })
  
  // States for minimizing/maximizing sections
  const [sidebarMinimized, setSidebarMinimized] = useState(fullWidth)
  const [videoMaximized, setVideoMaximized] = useState(false)
  const [feedbackMinimized, setFeedbackMinimized] = useState(false)
  
  // Keep internal state for shortcuts if not controlled by parent
  const [internalShortcutsState, setInternalShortcutsState] = useState(false);
  
  // Use the showKeyboardShortcuts prop if provided
  // Otherwise fall back to internal state
  const isShowingShortcuts = onShortcutsChange ? showKeyboardShortcuts : internalShortcutsState;
  const setIsShowingShortcuts = (show: boolean) => {
    if (onShortcutsChange) {
      onShortcutsChange(show);
    } else {
      setInternalShortcutsState(show);
    }
  }
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = SEGMENTS[currentSegment].videoPath
      videoRef.current.load()
    }
  }, [currentSegment])

  const initMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []
        await processAudioWithWhisper(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
    } catch (error) {
      console.error('Error initializing media recorder:', error)
      setError('Failed to access microphone. Please check your permissions.')
    }
  }

  const toggleRecording = () => {
    if (!isRecording) {
      if (!mediaRecorderRef.current) {
        initMediaRecorder().then(() => {
          mediaRecorderRef.current?.start()
          setIsRecording(true)
          setError(null)
        })
      } else {
        mediaRecorderRef.current.start()
        setIsRecording(true)
        setError(null)
      }
    } else {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    }
  }

  const processAudioWithWhisper = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to process audio')
      }

      const data = await response.json()
      
      if (data.success && data.text) {
        setAnswers(prev => ({
          ...prev,
          [SEGMENTS[currentSegment].question]: data.text
        }))
        updateLoanEligibility(currentSegment, data.text)
      } else {
        throw new Error(data.error || 'Failed to transcribe audio')
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      setError('Failed to process your response. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const updateLoanEligibility = (segment: number, answer: string) => {
    const answerLower = answer.toLowerCase()
    
    switch (segment) {
      case 0: // Employment Status
        setLoanEligibility(prev => ({
          ...prev,
          employmentType: answerLower.includes('salaried') ? 'salaried' : 'self-employed'
        }))
        break
      
      case 1: // Loan Details
        const amountMatch = answer.match(/(\d+)\s*(?:lakhs?|lacs?)/i)
        const tenureMatch = answer.match(/(\d+)\s*(?:years?|yrs?)/i)
        
        setLoanEligibility(prev => ({
          ...prev,
          tenure: tenureMatch ? parseInt(tenureMatch[1]) : 0
        }))
        break
      
      case 2: // Collateral Information
        setLoanEligibility(prev => ({
          ...prev,
          hasCollateral: answerLower.includes('yes') || answerLower.includes('have')
        }))
        break
      
      case 3: // Documentation
        setLoanEligibility(prev => ({
          ...prev,
          hasDocuments: answerLower.includes('yes') || answerLower.includes('have')
        }))
        break
      
      case 4: // Income Assessment
        setLoanEligibility(prev => ({
          ...prev,
          exceedsIncomeCap: answerLower.includes('yes') || answerLower.includes('exceed')
        }))
        break
      
      case 5: // Monthly Income
        const incomeMatch = answer.match(/(\d+)/);
        if (incomeMatch) {
          setLoanEligibility(prev => ({
            ...prev,
            monthlyIncome: parseInt(incomeMatch[1])
          }))
        }
        break
    }
  }

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleNext = async () => {
    if (!answers[SEGMENTS[currentSegment].question]) {
      setError('Please provide an answer before proceeding.')
      return
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/analyze-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: { [SEGMENTS[currentSegment].question]: answers[SEGMENTS[currentSegment].question] },
          segmentTitle: SEGMENTS[currentSegment].title,
          loanEligibility
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get feedback')
      }

      const data = await response.json()
      setFeedback(data.feedback)
      setIsProcessing(false)
      setFeedbackMinimized(false) // Show feedback when received
    } catch (error) {
      console.error('Error getting feedback:', error)
      setError('Failed to get feedback. Please try again.')
      setIsProcessing(false)
    }
  }

  // Update sidebarMinimized if fullWidth changes
  useEffect(() => {
    setSidebarMinimized(fullWidth);
  }, [fullWidth]);

  // Add this effect for keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in a text field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // ? key for showing keyboard shortcuts
      if (e.key === '?') {
        setIsShowingShortcuts(!isShowingShortcuts);
        return;
      }
      
      // S key for toggling sidebar
      if (e.key === 's' || e.key === 'S') {
        setSidebarMinimized(prev => !prev);
      }
      
      // V key for toggling video maximization
      if (e.key === 'v' || e.key === 'V') {
        setVideoMaximized(prev => !prev);
      }
      
      // Space for play/pause (prevent default to avoid page scrolling)
      if (e.key === ' ' && videoRef.current) {
        e.preventDefault();
        toggleVideo();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className={cn(
      "grid gap-6 transition-all duration-300",
      sidebarMinimized ? "grid-cols-1" : "grid-cols-4",
      videoMaximized ? "grid-cols-1" : ""
    )}>
      {/* Sections Sidebar */}
      {!sidebarMinimized && (
        <Card className="col-span-1 relative">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Sections</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarMinimized(true)}
                className="h-8 w-8"
                title="Minimize Sections (Press S)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Navigate through different topics</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {SEGMENTS.map((segment, index) => (
                <button
                  key={segment.id}
                  onClick={() => {
                    setCurrentSegment(index)
                    setFeedback("")
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    "border-l-2 flex flex-col gap-1",
                    currentSegment === index 
                      ? "border-l-primary bg-muted/50" 
                      : "border-l-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{segment.title}</span>
                    <span className="text-xs text-muted-foreground">{segment.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {segment.description}
                  </p>
                  {answers[segment.question] && (
                    <div className="mt-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 w-fit">
                      Completed
                    </div>
                  )}
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className={cn(
        "space-y-6",
        sidebarMinimized ? "col-span-full" : "col-span-3"
      )}>
        {sidebarMinimized && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSidebarMinimized(false)}
            className="mb-2"
            title="Show Sections (Press S)"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Show Sections
          </Button>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{SEGMENTS[currentSegment].title}</CardTitle>
                <CardDescription className="mt-1.5">{SEGMENTS[currentSegment].question}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Section {currentSegment + 1} of {SEGMENTS.length}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setVideoMaximized(!videoMaximized)}
                  className="h-8 w-8"
                  title={videoMaximized ? "Normal size (Press V)" : "Full size (Press V)"}
                >
                  {videoMaximized ? 
                    <Minimize2 className="h-4 w-4" /> : 
                    <Maximize2 className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Video Player */}
              <div className={cn(
                "relative rounded-lg overflow-hidden bg-black",
                videoMaximized ? "aspect-video w-full max-w-full" : "aspect-video"
              )}>
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  controls={videoMaximized}
                />
              </div>

              {/* Video Controls */}
              <div className="flex justify-center gap-2">
                <Button onClick={toggleVideo} variant="outline" title="Play/Pause (Press Spacebar)">
                  {isPlaying ? (
                    <><Pause className="h-4 w-4 mr-2" /> Pause</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Play</>
                  )}
                </Button>
              </div>

              {/* Recording Controls - Only show if video is not maximized */}
              {!videoMaximized && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Your Answer</Label>
                    <Button
                      onClick={toggleRecording}
                      variant={isRecording ? "destructive" : "outline"}
                      disabled={isProcessing}
                    >
                      {isRecording ? (
                        <><StopCircle className="h-4 w-4 mr-2" /> Stop Recording</>
                      ) : (
                        <><Mic className="h-4 w-4 mr-2" /> Start Recording</>
                      )}
                    </Button>
                  </div>

                  <Textarea
                    value={answers[SEGMENTS[currentSegment].question] || ""}
                    onChange={(e) => {
                      setAnswers(prev => ({
                        ...prev,
                        [SEGMENTS[currentSegment].question]: e.target.value
                      }))
                      updateLoanEligibility(currentSegment, e.target.value)
                    }}
                    placeholder="Your answer will appear here after recording..."
                    className="min-h-[100px]"
                  />

                  {isProcessing && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing your response...
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  {/* Feedback section with minimize/maximize toggle */}
                  {feedback && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">ILLMATIC's Feedback:</h4>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setFeedbackMinimized(!feedbackMinimized)}
                          className="h-6 w-6"
                          title={feedbackMinimized ? "Expand feedback" : "Minimize feedback"}
                        >
                          {feedbackMinimized ? 
                            <Maximize2 className="h-3 w-3" /> : 
                            <Minimize2 className="h-3 w-3" />
                          }
                        </Button>
                      </div>
                      {!feedbackMinimized && (
                        <p className="text-sm text-muted-foreground">{feedback}</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Button
                      onClick={handleNext}
                      disabled={!answers[SEGMENTS[currentSegment].question] || isProcessing}
                    >
                      {isProcessing ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing</>
                      ) : (
                        <><MessageSquare className="h-4 w-4 mr-2" /> Get Feedback</>
                      )}
                    </Button>
                    <div className="flex gap-2">
                      {feedback && currentSegment === SEGMENTS.length - 1 && (
                        <Button
                          onClick={() => window.location.href = '/ai-chatbot'}
                          variant="default"
                        >
                          Chat with ILLMATIC
                        </Button>
                      )}
                      {feedback && (
                        <Button
                          onClick={() => {
                            setFeedback("");
                            if (currentSegment < SEGMENTS.length - 1) {
                              setCurrentSegment(currentSegment + 1);
                            }
                          }}
                          variant="outline"
                        >
                          {currentSegment < SEGMENTS.length - 1 ? (
                            <>Next <SkipForward className="h-4 w-4 ml-2" /></>
                          ) : (
                            'Complete'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar - Only show if video is not maximized */}
        {!videoMaximized && (
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${((currentSegment + 1) / SEGMENTS.length) * 100}%`
              }}
            />
          </div>
        )}
      </div>

      {/* Keyboard shortcuts dialog */}
      <Dialog open={isShowingShortcuts} onOpenChange={setIsShowingShortcuts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to navigate the dashboard quickly
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">F</kbd>
              <span className="text-sm">Toggle full width mode</span>
            </div>
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">S</kbd>
              <span className="text-sm">Toggle sections sidebar</span>
            </div>
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">V</kbd>
              <span className="text-sm">Toggle video size</span>
            </div>
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Space</kbd>
              <span className="text-sm">Play/Pause video</span>
            </div>
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">?</kbd>
              <span className="text-sm">Show/hide this guide</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">?</kbd> anytime to see these shortcuts
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
