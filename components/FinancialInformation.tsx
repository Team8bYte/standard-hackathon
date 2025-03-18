import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Video, StopCircle, PlayCircle, RefreshCcw, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define the questions that need to be answered
const FINANCIAL_QUESTIONS = [
  "What is your annual income?",
  "What is your current employment status and duration?",
  "Do you have any existing loans or debts? If yes, please specify the amounts.",
  "What is the purpose of this loan?",
  "How much loan amount are you requesting?",
  "What is your preferred loan repayment period?",
  "Do you have any collateral to offer against this loan?",
  "Please describe your monthly expenses including rent/mortgage, utilities, etc."
];

type Answer = {
  question: string;
  answer: string;
  confidence: number;
  needsRerecording?: boolean;
  manualAnswer?: string;
}

type FinancialInformationProps = {
  onComplete?: () => void;
};

export default function FinancialInformation({ onComplete }: FinancialInformationProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [videoURL, setVideoURL] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState({ title: "", description: "" })
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const [manualAnswers, setManualAnswers] = useState<{[key: string]: string}>({});
  const [isComplete, setIsComplete] = useState(false);

  // Initialize media recorder
  useEffect(() => {
    const initializeMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        mediaStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setRecordedChunks(prev => [...prev, e.data]);
          }
        };
        
        setMediaRecorder(recorder);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setAlertMessage({
          title: "Camera Access Error",
          description: "Please ensure you have granted camera and microphone permissions."
        });
        setAlertOpen(true);
      }
    };

    initializeMediaRecorder();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start recording
  const startRecording = () => {
    setRecordedChunks([]);
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      mediaRecorder.start(1000);
      setIsRecording(true);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Create video URL from recorded chunks
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
    }
  };

  // Process the recorded video
  const processVideo = async () => {
    if (!recordedChunks.length) return;
    
    setIsProcessing(true);
    try {
      const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
      const formData = new FormData();
      formData.append("video", videoBlob);
      
      const response = await fetch("/api/process-video", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to process video");
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAnswers(data.answers);
      
      // Check if any answers need re-recording
      const needsRerecording = data.answers.some((answer: Answer) => answer.needsRerecording);
      if (needsRerecording) {
        setAlertMessage({
          title: "Some Answers Need Clarification",
          description: "Please review your answers below. You may need to re-record responses for questions marked with a warning icon."
        });
        setAlertOpen(true);
      } else {
        setAlertMessage({
          title: "Responses Processed Successfully",
          description: "All your answers have been processed successfully. Please review them below."
        });
        setAlertOpen(true);
      }
    } catch (error) {
      console.error("Error processing video:", error);
      setAlertMessage({
        title: "Processing Error",
        description: "There was an error processing your video. Please try recording again."
      });
      setAlertOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset recording
  const resetRecording = () => {
    setRecordedChunks([]);
    setVideoURL(null);
    setAnswers([]);
  };

  // Check if all questions are answered
  useEffect(() => {
    const allAnswered = FINANCIAL_QUESTIONS.every(question => {
      const answer = answers.find(a => a.question === question);
      return (answer && !answer.needsRerecording) || manualAnswers[question];
    });
    setIsComplete(allAnswered);
  }, [answers, manualAnswers]);

  // Handle manual answer change
  const handleManualAnswerChange = (question: string, value: string) => {
    setManualAnswers(prev => ({
      ...prev,
      [question]: value
    }));
  };

  // Get final answers combining recorded and manual inputs
  const getFinalAnswers = () => {
    return FINANCIAL_QUESTIONS.map(question => {
      const recordedAnswer = answers.find(a => a.question === question);
      const manualAnswer = manualAnswers[question];
      
      if (recordedAnswer && !recordedAnswer.needsRerecording) {
        return recordedAnswer;
      }
      
      return {
        question,
        answer: manualAnswer || "Not provided",
        confidence: manualAnswer ? 100 : 0,
        needsRerecording: !manualAnswer
      };
    });
  };

  // Save answers to localStorage
  const saveAnswers = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('financialAnswers', JSON.stringify(getFinalAnswers()));
    }
  };

  // Load saved answers from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAnswers = localStorage.getItem('financialAnswers');
      if (savedAnswers) {
        const parsed = JSON.parse(savedAnswers);
        setAnswers(parsed.filter((a: Answer) => !a.manualAnswer));
        setManualAnswers(
          parsed.reduce((acc: {[key: string]: string}, curr: Answer) => {
            if (curr.manualAnswer) {
              acc[curr.question] = curr.manualAnswer;
            }
            return acc;
          }, {})
        );
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
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

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information Interview</CardTitle>
          <CardDescription>
            Please record a video answering all the questions below. Speak clearly and address each question in order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] rounded-md border p-4">
            <ol className="space-y-2">
              {FINANCIAL_QUESTIONS.map((question, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recording Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Video Recording</CardTitle>
          <CardDescription>
            Record your responses to the questions above
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Video Preview */}
            <div className="relative aspect-video rounded-lg border bg-muted">
              {videoURL ? (
                <video
                  ref={videoRef}
                  src={videoURL}
                  controls
                  className="h-full w-full rounded-lg"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              {isRecording && (
                <div className="absolute top-2 right-2 flex items-center gap-2 rounded-full bg-red-100 px-2 py-1">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-700">Recording</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2">
              {!isRecording && !videoURL && (
                <Button onClick={startRecording} className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  Start Recording
                </Button>
              )}
              
              {isRecording && (
                <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                  <StopCircle className="h-4 w-4" />
                  Stop Recording
                </Button>
              )}
              
              {videoURL && (
                <>
                  <Button onClick={processVideo} disabled={isProcessing} className="flex items-center gap-2">
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Process Responses
                      </>
                    )}
                  </Button>
                  
                  <Button onClick={resetRecording} variant="outline" className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Record Again
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processed Answers */}
      {answers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Responses</CardTitle>
            <CardDescription>
              Review your responses. For any missing or unclear answers, please provide them manually below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {FINANCIAL_QUESTIONS.map((question, index) => {
                const answer = answers.find(a => a.question === question);
                const needsManualInput = !answer || answer.needsRerecording;
                
                return (
                  <div key={index} className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{question}</h4>
                          {answer && !answer.needsRerecording ? (
                            <p className="text-sm text-muted-foreground">{answer.answer}</p>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor={`answer-${index}`}>Your Answer</Label>
                              <Input
                                id={`answer-${index}`}
                                value={manualAnswers[question] || ''}
                                onChange={(e) => handleManualAnswerChange(question, e.target.value)}
                                placeholder="Type your answer here..."
                              />
                            </div>
                          )}
                        </div>
                        {answer && !answer.needsRerecording ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {isComplete 
            ? "All questions have been answered. You can proceed with your application." 
            : "Please answer all questions to continue."}
        </p>
        <Button
          onClick={() => {
            saveAnswers();
            onComplete?.();
          }}
          disabled={!isComplete}
          className="flex items-center gap-2"
        >
          Continue Application
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 