"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, MessageSquare, Loader2, Heart, AlertTriangle } from "lucide-react"

export default function EmotionalSupport() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [userMessage, setUserMessage] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Initialize and clean up media recorder
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])
  
  const initializeMediaRecorder = async () => {
    try {
      setRecordingError(null)
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      // Set up event handlers
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
      
      return true
    } catch (error) {
      console.error("Error initializing media recorder:", error)
      setRecordingError("Could not access your microphone. Please check your permissions and try again.")
      return false
    }
  }
  
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        
        // Stop all audio tracks
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      setIsRecording(false)
    } else {
      // Start recording
      const initialized = await initializeMediaRecorder()
      if (!initialized) return
      
      audioChunksRef.current = []
      mediaRecorderRef.current?.start()
      
      // Start timer for recording duration
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      setIsRecording(true)
    }
  }
  
  const processAudioWithWhisper = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true)
      
      // Create form data for API request
      const formData = new FormData()
      formData.append('audio', audioBlob)
      
      // Send the audio file to Whisper API
      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe audio')
      }
      
      if (data.success && data.text) {
        setUserMessage(data.text)
      } else {
        throw new Error(data.error || 'No transcription received')
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      setRecordingError("Failed to transcribe your message. Please try again or type your message directly.")
    } finally {
      setIsProcessing(false)
    }
  }
  
  const sendMessageToAI = async () => {
    if (!userMessage.trim()) return
    
    setIsProcessing(true)
    let timeoutId: NodeJS.Timeout | undefined;
    
    try {
      // Create a timeout Promise that rejects after 15 seconds
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Request timed out'));
        }, 15000);
      });
      
      // Create the fetch Promise
      const fetchPromise = fetch("/api/emotional-support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage
        }),
      });
      
      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      // Clear timeout when we get a response
      if (timeoutId) clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setAiResponse(data.response);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setAiResponse("I'm sorry, I couldn't process your request at this moment. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  }
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Emotional Support</h1>
        <p className="text-muted-foreground">
          Share your thoughts about your loan journey and get supportive guidance
        </p>
      </div>
      
      {/* Recording Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            Express Yourself
          </CardTitle>
          <CardDescription>
            Record your voice or type your message to share your feelings about your loan journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Button
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "outline"}
              className={`px-6 py-8 rounded-full ${isRecording ? "animate-pulse" : ""}`}
              size="lg"
            >
              {isRecording ? (
                <><MicOff className="h-6 w-6 mr-2" /> Stop Recording ({formatTime(recordingTime)})</>
              ) : (
                <><Mic className="h-6 w-6 mr-2" /> Start Recording</>
              )}
            </Button>
          </div>
          
          {recordingError && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{recordingError}</p>
            </div>
          )}
          
          <div className="mt-4">
            <Textarea
              placeholder="Type or edit your message here..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={sendMessageToAI}
              disabled={isProcessing || !userMessage.trim()}
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing</>
              ) : (
                <><MessageSquare className="h-4 w-4 mr-2" /> Get Support</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* AI Response */}
      {aiResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 text-red-500 mr-2" />
              Supportive Guidance
            </CardTitle>
            <CardDescription>
              Personal support for your financial journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="whitespace-pre-line">{aiResponse}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Guidance */}
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Why Share Your Feelings?</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Taking a loan is an emotional decision that affects your life significantly</li>
          <li>Expressing your concerns helps you make more rational financial choices</li>
          <li>Our AI assistant provides supportive guidance tailored to your feelings</li>
          <li>All conversations are private and confidential</li>
        </ul>
      </div>
    </div>
  )
} 