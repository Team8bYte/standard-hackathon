"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, SkipForward, MessageSquare, Video, CheckCircle2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Training videos with their questions
const TRAINING_VIDEOS = [
  {
    id: 1,
    filename: "WhatsApp Video 2025-03-18 at 19.01.03.mp4",
    title: "Loan Application Process",
    questions: [
      "What are the key steps in processing a loan application?",
      "How do you verify applicant identity?",
      "What documentation is required for loan approval?",
    ]
  },
  {
    id: 2,
    filename: "WhatsApp Video 2025-03-18 at 19.02.41.mp4",
    title: "Risk Assessment Guidelines",
    questions: [
      "What are the main risk factors to consider?",
      "How do you evaluate an applicant's creditworthiness?",
      "What are the red flags to watch for?",
    ]
  }
];

export default function GuidanceSection() {
  const [currentVideo, setCurrentVideo] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [userAnswer, setUserAnswer] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState({ title: "", description: "" })
  const videoRef = useRef<HTMLVideoElement>(null)

  // Load video source
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = `/videos/${TRAINING_VIDEOS[currentVideo].filename}`
    }
  }, [currentVideo])

  // Handle video playback
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Process user's answer with AI
  const processAnswer = async () => {
    if (!userAnswer.trim()) {
      setAlertMessage({
        title: "Answer Required",
        description: "Please provide an answer before proceeding."
      })
      setShowAlert(true)
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/process-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: TRAINING_VIDEOS[currentVideo].questions[currentQuestion],
          answer: userAnswer,
          context: TRAINING_VIDEOS[currentVideo].title,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setAiResponse(data.response)
    } catch (error) {
      console.error("Error processing answer:", error)
      setAlertMessage({
        title: "Processing Error",
        description: "Failed to process your answer. Please try again."
      })
      setShowAlert(true)
    } finally {
      setIsProcessing(false)
    }
  }

  // Move to next question or video
  const handleNext = () => {
    if (currentQuestion < TRAINING_VIDEOS[currentVideo].questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else if (currentVideo < TRAINING_VIDEOS.length - 1) {
      setCurrentVideo(currentVideo + 1)
      setCurrentQuestion(0)
    }
    setUserAnswer("")
    setAiResponse("")
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Okay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video Player */}
      <Card>
        <CardHeader>
          <CardTitle>{TRAINING_VIDEOS[currentVideo].title}</CardTitle>
          <CardDescription>
            Watch the training video and answer the questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-full"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={togglePlayPause} variant="outline">
                {isPlaying ? (
                  <><Pause className="h-4 w-4 mr-2" /> Pause</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" /> Play</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question and Answer Section */}
      <Card>
        <CardHeader>
          <CardTitle>Question {currentQuestion + 1}</CardTitle>
          <CardDescription>
            {TRAINING_VIDEOS[currentVideo].questions[currentQuestion]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your answer here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-between">
              <Button
                onClick={processAnswer}
                disabled={isProcessing || !userAnswer.trim()}
              >
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing</>
                ) : (
                  <><MessageSquare className="h-4 w-4 mr-2" /> Get Feedback</>
                )}
              </Button>
              {aiResponse && (
                <Button
                  onClick={handleNext}
                  variant="outline"
                >
                  Next <SkipForward className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            {aiResponse && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">AI Feedback:</h4>
                <p className="text-sm text-muted-foreground">{aiResponse}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Video {currentVideo + 1} of {TRAINING_VIDEOS.length},
          Question {currentQuestion + 1} of {TRAINING_VIDEOS[currentVideo].questions.length}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Progress:</span>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${((currentVideo * TRAINING_VIDEOS[currentVideo].questions.length + currentQuestion + 1) /
                  (TRAINING_VIDEOS.length * TRAINING_VIDEOS[currentVideo].questions.length)) *
                  100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 