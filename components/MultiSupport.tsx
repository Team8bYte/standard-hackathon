import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, SkipForward, MessageSquare, Video, Globe2, Loader2, AlertTriangle } from "lucide-react"

type Language = "english" | "hindi" | "marathi" | "gujarati"

const SEGMENTS = [
  {
    id: 1,
    title: "Loan Purpose",
    question: "What is the purpose of your loan?",
    videoPath: {
      english: "/videos/support/v1/english.mp4",
      hindi: "/videos/support/v1/hindi.mp4",
      marathi: "/videos/support/v1/marathi.mp4",
      gujarati: "/videos/support/v1/guju.mp4"
    }
  },
  {
    id: 2,
    title: "Income & Employment",
    question: "What is your annual income and current employment?",
    videoPath: {
      english: "/videos/support/v2/english.mp4",
      hindi: "/videos/support/v2/hindi.mp4",
      marathi: "/videos/support/v2/marathi.mp4",
      gujarati: "/videos/support/v2/guju.mp4"
    }
  },
  {
    id: 3,
    title: "Document Upload",
    question: "Please upload your Aadhaar, PAN, and salary slip for verification",
    videoPath: {
      english: "/videos/support/v3/english.mp4",
      hindi: "/videos/support/v3/hindi.mp4",
      marathi: "/videos/support/v3/marathi.mp4",
      gujarati: "/videos/support/v3/guju.mp4"
    }
  },
  {
    id: 4,
    title: "CIBIL Score",
    question: "What is your CIBIL score?",
    videoPath: {
      english: "/videos/support/v4/english.mp4",
      hindi: "/videos/support/v4/hindi.mp4",
      marathi: "/videos/support/v4/marathi.mp4",
      gujarati: "/videos/support/v4/guju.mp4"
    }
  },
  {
    id: 5,
    title: "Disbursement Preference",
    question: "If the loan is approved, would you like to receive the amount directly in your bank account or through demand draft?",
    videoPath: {
      english: "/videos/support/v5/english.mp4",
      hindi: "/videos/support/v5/hindi.mp4",
      marathi: "/videos/support/v5/marathi.mp4",
      gujarati: "/videos/support/v5/guju.mp4"
    }
  }
]

export default function MultiSupport() {
  const [currentSegment, setCurrentSegment] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english")
  const [userAnswer, setUserAnswer] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Load video when segment or language changes
  useEffect(() => {
    if (videoRef.current) {
      setVideoError(null)
      const videoPath = SEGMENTS[currentSegment].videoPath[selectedLanguage]
      
      // Check if video file exists
      fetch(videoPath, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Video not found: ${videoPath}`)
          }
          videoRef.current!.src = videoPath
          videoRef.current!.load()
        })
        .catch(error => {
          console.error("Error loading video:", error)
          setVideoError(`Video not available in ${selectedLanguage}. Please try another language.`)
        })
    }
  }, [currentSegment, selectedLanguage])

  const togglePlayPause = () => {
    if (videoRef.current && !videoError) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error)
          setVideoError("Error playing video. Please try again.")
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language)
    setVideoError(null)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const processAnswer = async () => {
    if (!userAnswer.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/process-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: SEGMENTS[currentSegment].question,
          answer: userAnswer,
          context: SEGMENTS[currentSegment].title,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setAiResponse(data.response)
    } catch (error) {
      console.error("Error processing answer:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNext = () => {
    if (currentSegment < SEGMENTS.length - 1) {
      setCurrentSegment(currentSegment + 1)
      setUserAnswer("")
      setAiResponse("")
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        setIsPlaying(false)
      }
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Multi-Language Support</h1>
          <p className="text-muted-foreground mt-1">
            Get assistance in your preferred language
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-muted-foreground" />
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="border rounded-md px-3 py-1"
          >
            <option value="english">English</option>
            <option value="hindi">हिंदी</option>
            <option value="marathi">मराठी</option>
            <option value="gujarati">ગુજરાતી</option>
          </select>
        </div>
      </div>

      {/* Video Player */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{SEGMENTS[currentSegment].title}</CardTitle>
          <CardDescription>
            Watch the guidance video in your preferred language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              {videoError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center p-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{videoError}</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setVideoError("Error loading video. Please try another language.")}
                  controls // Add native controls as fallback
                />
              )}
            </div>
            <div className="flex justify-center gap-2">
              <Button 
                onClick={togglePlayPause} 
                variant="outline"
                disabled={!!videoError}
              >
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
          <CardTitle>Question {currentSegment + 1}</CardTitle>
          <CardDescription>
            {SEGMENTS[currentSegment].question}
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
                <Button onClick={handleNext} variant="outline">
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
      <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Question {currentSegment + 1} of {SEGMENTS.length}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Progress:</span>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${((currentSegment + 1) / SEGMENTS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 