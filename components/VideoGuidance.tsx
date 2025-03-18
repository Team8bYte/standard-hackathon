"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, Mic, StopCircle, SkipForward, Loader2, AlertTriangle, MessageSquare } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

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

export default function VideoGuidance() {
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
    } catch (error) {
      console.error('Error getting feedback:', error)
      setError('Failed to get feedback. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Sections Sidebar */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Sections</CardTitle>
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

      {/* Main Content */}
      <div className="col-span-3 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{SEGMENTS[currentSegment].title}</CardTitle>
                <CardDescription className="mt-1.5">{SEGMENTS[currentSegment].question}</CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Section {currentSegment + 1} of {SEGMENTS.length}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Video Player */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>

              {/* Video Controls */}
              <div className="flex justify-center gap-2">
                <Button onClick={toggleVideo} variant="outline">
                  {isPlaying ? (
                    <><Pause className="h-4 w-4 mr-2" /> Pause</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Play</>
                  )}
                </Button>
              </div>

              {/* Recording Controls */}
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

                {feedback && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">ILLMATIC's Feedback:</h4>
                    <p className="text-sm text-muted-foreground">{feedback}</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${((currentSegment + 1) / SEGMENTS.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}
