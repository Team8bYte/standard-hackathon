import { useState, useRef, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  StopCircle,
  PlayCircle,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Camera,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOurFormContext } from "@/contexts/FormContext";
import { getUserItem, setUserItem } from "@/lib/user-data";

// Define the questions that need to be answered
export const FINANCIAL_QUESTIONS = [
  "What is your annual income?",
  "What is your current employment status and duration?",
  "Do you have any existing loans or debts? If yes, please specify the amounts.",
  "What is the purpose of this loan?",
  "How much loan amount are you requesting?",
  "What is your preferred loan repayment period?",
  "Do you have any collateral to offer against this loan?",
  "Please describe your monthly expenses including rent/mortgage, utilities, etc.",
];

type Answer = {
  question: string;
  answer: string;
  confidence: number;
  needsRerecording?: boolean;
  manualAnswer?: string;
};

type FinancialInformationProps = {
  onComplete?: () => void;
};

export default function FinancialInformation({
  onComplete,
}: FinancialInformationProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({
    title: "",
    description: "",
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [manualAnswers, setManualAnswers] = useState<{ [key: string]: string }>(
    {},
  );
  const [isComplete, setIsComplete] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [recordingMode, setRecordingMode] = useState<"all" | "specific">("all");

  const { updateFormData } = useOurFormContext();

  // Initialize media recorder
  useEffect(() => {
    const initializeMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        mediaStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setRecordedChunks((prev) => [...prev, e.data]);
          }
        };

        setMediaRecorder(recorder);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setAlertMessage({
          title: "Camera Access Error",
          description:
            "Please ensure you have granted camera and microphone permissions.",
        });
        setAlertOpen(true);
      }
    };

    initializeMediaRecorder();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
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
      
      // If recording for a specific question, add that information
      if (recordingMode === "specific" && selectedQuestion) {
        formData.append("specificQuestion", selectedQuestion);
      }

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

      // If recording mode is specific, update only that specific answer
      if (recordingMode === "specific" && selectedQuestion) {
        const specificAnswer = data.answers.find(
          (a: Answer) => a.question === selectedQuestion
        );
        
        if (specificAnswer) {
          setAnswers(prev => {
            const newAnswers = [...prev];
            const index = newAnswers.findIndex(a => a.question === selectedQuestion);
            
            if (index >= 0) {
              newAnswers[index] = specificAnswer;
            } else {
              newAnswers.push(specificAnswer);
            }
            
            return newAnswers;
          });
        }
        
        setAlertMessage({
          title: "Response Processed Successfully",
          description: `Your answer to "${selectedQuestion}" has been processed.`,
        });
      } else {
        // For full interview recording
        setAnswers(data.answers);
        
        // Check if any answers need re-recording
        const needsRerecording = data.answers.some(
          (answer: Answer) => answer.needsRerecording,
        );
        
        if (needsRerecording) {
          setAlertMessage({
            title: "Some Answers Need Clarification",
            description:
              "Please review your answers below. You may need to re-record responses for questions marked with a warning icon.",
          });
        } else {
          setAlertMessage({
            title: "Responses Processed Successfully",
            description:
              "All your answers have been processed successfully. Please review them below.",
          });
        }
      }
      
      // Reset recording mode and selected question
      setRecordingMode("all");
      setSelectedQuestion(null);
      
      // Update form context
      updateFormData({ answers: data.answers });
      
      setAlertOpen(true);
    } catch (error) {
      console.error("Error processing video:", error);
      setAlertMessage({
        title: "Processing Error",
        description:
          "There was an error processing your video. Please try recording again.",
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
    setSelectedQuestion(null);
    setRecordingMode("all");
    
    // Don't reset answers here as we want to keep previously processed answers
  };

  // Check if all questions are answered
  useEffect(() => {
    const allAnswered = FINANCIAL_QUESTIONS.every((question) => {
      const answer = answers.find((a) => a.question === question);
      return (answer && !answer.needsRerecording) || manualAnswers[question];
    });
    setIsComplete(allAnswered);
  }, [answers, manualAnswers]);

  // Handle manual answer change
  const handleManualAnswerChange = (question: string, value: string) => {
    setManualAnswers((prev) => {
      const updated = {
        ...prev,
        [question]: value,
      };
      
      // Save answers immediately after manual input changes
      if (value.trim() !== '') {
        // Update local state first
        const updatedAnswers = [...answers];
        const existingIndex = updatedAnswers.findIndex(a => a.question === question);
        
        // If answer exists, update it or add a new one
        if (existingIndex >= 0) {
          updatedAnswers[existingIndex] = {
            ...updatedAnswers[existingIndex],
            manualAnswer: value,
            needsRerecording: false,
          };
        } else {
          updatedAnswers.push({
            question,
            answer: value,
            confidence: 100,
            manualAnswer: value,
            needsRerecording: false,
          });
        }
        
        // Update the answers state
        setAnswers(updatedAnswers);
        
        // Schedule the save operation for the next tick
        setTimeout(() => {
          const finalAnswers = saveAnswersToStorage(updatedAnswers, updated);
          if (finalAnswers) {
            const formattedAnswers = finalAnswers.map(answer => answer.answer);
            updateFormData({ answers: formattedAnswers });
          }
        }, 0);
      }
      
      return updated;
    });
  };

  // Extract saveAnswersToStorage from saveAnswers to avoid duplication
  const saveAnswersToStorage = (currentAnswers: Answer[], currentManualAnswers: {[key: string]: string}) => {
    if (typeof window !== "undefined") {
      // Get final answers combining current answers and manual inputs
      const finalAnswers = FINANCIAL_QUESTIONS.map((question) => {
        const recordedAnswer = currentAnswers.find((a) => a.question === question);
        const manualAnswer = currentManualAnswers[question];

        if (recordedAnswer && !recordedAnswer.needsRerecording) {
          // If we have a valid recorded answer, use it
          return recordedAnswer;
        }

        // Otherwise use manual answer
        return {
          question,
          answer: manualAnswer || "Not provided",
          confidence: manualAnswer ? 100 : 0,
          needsRerecording: !manualAnswer,
          manualAnswer: manualAnswer,
        };
      });
      
      // Use utility function to save with user-specific key
      setUserItem("financialAnswers", finalAnswers);
      
      // Return the finalAnswers so they can be used by the caller if needed
      return finalAnswers;
    }
    return null;
  };

  // Save answers to localStorage 
  const saveAnswers = () => {
    if (typeof window !== "undefined") {
      const finalAnswers = saveAnswersToStorage(answers, manualAnswers);
      
      // Update form data with the saved answers
      if (finalAnswers) {
        setTimeout(() => {
          const formattedAnswers = finalAnswers.map(answer => answer.answer);
          updateFormData({ answers: formattedAnswers });
        }, 0);
      }
    }
  };

  // Load saved answers from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Use utility function to get user-specific answers
      const savedAnswers = getUserItem<Answer[]>("financialAnswers");
      
      if (savedAnswers) {
        try {
          // Filter out answers that are properly recorded
          const recordedAnswers = savedAnswers.filter((a) => !a.needsRerecording || (a.manualAnswer && a.manualAnswer.trim() !== ''));
          
          // Extract manual answers for input fields
          const manualInputs = savedAnswers.reduce((acc: { [key: string]: string }, curr: Answer) => {
            if (curr.manualAnswer) {
              acc[curr.question] = curr.manualAnswer;
            } else if (curr.needsRerecording && curr.answer && curr.answer !== "Not provided") {
              // If it needs re-recording but has an answer, use it as a starting point
              acc[curr.question] = curr.answer;
            }
            return acc;
          }, {});
          
          setAnswers(recordedAnswers);
          setManualAnswers(manualInputs);
          
          // Check if all questions are answered after loading
          const allAnswered = FINANCIAL_QUESTIONS.every((question) => {
            const answer = recordedAnswers.find((a) => a.question === question);
            return (answer && !answer.needsRerecording) || manualInputs[question];
          });
          setIsComplete(allAnswered);
        } catch (error) {
          console.error("Error parsing saved answers:", error);
        }
      }
    }
  }, []);

  // Start recording for a specific question
  const startSpecificRecording = (question: string) => {
    setSelectedQuestion(question);
    setRecordingMode("specific");
    
    // Reset any previous recording
    if (videoURL) {
      setRecordedChunks([]);
      setVideoURL(null);
    }
    
    // Start the recording
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      mediaRecorder.start(1000);
      setIsRecording(true);
    }
  };

  // Get final answers combining recorded and manual inputs
  const getFinalAnswers = () => {
    return FINANCIAL_QUESTIONS.map((question) => {
      const recordedAnswer = answers.find((a) => a.question === question);
      const manualAnswer = manualAnswers[question];

      if (recordedAnswer && !recordedAnswer.needsRerecording) {
        return recordedAnswer;
      }

      return {
        question,
        answer: manualAnswer || "Not provided",
        confidence: manualAnswer ? 100 : 0,
        needsRerecording: !manualAnswer,
      };
    });
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Okay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Card with Side-by-Side Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information Interview</CardTitle>
          <CardDescription>
            {recordingMode === "specific" && selectedQuestion 
              ? `Record your answer to: "${selectedQuestion}"` 
              : "Please record a video answering all the questions below. Speak clearly and address each question in order."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Questions Section - Left Side */}
            <div>
              <h3 className="text-sm font-medium mb-2">Questions to Answer:</h3>
              <ScrollArea className="h-[350px] rounded-md border p-4">
                <ol className="space-y-4">
                  {FINANCIAL_QUESTIONS.map((question, index) => {
                    const answer = answers.find((a) => a.question === question);
                    const manualAnswer = manualAnswers[question];
                    const isAnswered = (answer && !answer.needsRerecording) || manualAnswer;
                    const displayAnswer = answer?.answer || manualAnswer || "";
                    
                    return (
                      <li key={index} className={`pb-2 border-b border-dashed last:border-b-0 ${selectedQuestion === question ? 'bg-blue-50 p-2 rounded' : ''}`}>
                        <div className="flex gap-2 items-start">
                          <div className="min-w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                            {index + 1}
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="font-medium">{question}</div>
                            {isAnswered && (
                              <p className="text-xs text-green-600 italic">{displayAnswer}</p>
                            )}
                            
                            {/* Record specific answer button */}
                            {(!isAnswered || (answer?.needsRerecording)) && !isRecording && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 text-xs h-7 px-2"
                                onClick={() => startSpecificRecording(question)}
                              >
                                <Camera className="h-3 w-3 mr-1" />
                                Record This Answer
                              </Button>
                            )}
                          </div>
                          {isAnswered ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-1 shrink-0" />
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </ScrollArea>
            </div>

            {/* Recording Interface - Right Side */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium mb-2">
                {recordingMode === "specific" && selectedQuestion 
                  ? `Recording answer for: Q${FINANCIAL_QUESTIONS.findIndex(q => q === selectedQuestion) + 1}` 
                  : "Record Your Responses:"}
              </h3>
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
                    <span className="text-xs font-medium text-red-700">
                      Recording
                    </span>
                  </div>
                )}
                
                {selectedQuestion && !isRecording && !videoURL && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                    <div className="bg-white p-3 rounded-lg shadow-md text-center max-w-[80%]">
                      <h4 className="text-sm font-medium mb-2">Recording for Question:</h4>
                      <p className="text-xs">{selectedQuestion}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-2">
                {!isRecording && !videoURL && recordingMode === "all" && (
                  <Button
                    onClick={startRecording}
                    className="flex items-center gap-2"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Start Recording All
                  </Button>
                )}
                
                {!isRecording && !videoURL && recordingMode === "specific" && (
                  <Button
                    onClick={() => selectedQuestion && startSpecificRecording(selectedQuestion)}
                    className="flex items-center gap-2"
                    disabled={!selectedQuestion}
                  >
                    <PlayCircle className="h-4 w-4" />
                    Start Recording Answer
                  </Button>
                )}

                {isRecording && (
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <StopCircle className="h-4 w-4" />
                    Stop Recording
                  </Button>
                )}

                {videoURL && (
                  <>
                    <Button
                      onClick={processVideo}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          {recordingMode === "specific" ? "Process Answer" : "Process Responses"}
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={resetRecording}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Record Again
                    </Button>
                  </>
                )}
                
                {recordingMode === "specific" && !isRecording && !videoURL && (
                  <Button
                    onClick={() => {
                      setSelectedQuestion(null);
                      setRecordingMode("all");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                )}
              </div>
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Tips:</strong> {recordingMode === "specific" 
                    ? "Focus on answering just the selected question clearly and directly." 
                    : "Speak clearly, face the camera, and address each question in order."}
                  {" "}You can also manually type answers below after recording.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processed Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Review & Edit Responses</CardTitle>
          <CardDescription>
            Review your responses. For any missing or unclear answers, you can record a specific answer or provide them manually below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {FINANCIAL_QUESTIONS.map((question, index) => {
              const answer = answers.find((a) => a.question === question);
              const hasManualAnswer = !!manualAnswers[question];
              const needsInput = !answer || answer.needsRerecording;
              const isAnswered = (answer && !answer.needsRerecording) || hasManualAnswer;

              return (
                <div key={index} className="space-y-2">
                  <div className={`rounded-lg border p-4 ${needsInput && !hasManualAnswer ? 'border-amber-200 bg-amber-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex gap-2 items-center">
                          <div className="min-w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                            {index + 1}
                          </div>
                          <h4 className="font-medium">{question}</h4>
                        </div>
                        
                        {/* Show recorded answer */}
                        {answer && !answer.needsRerecording ? (
                          <div className="ml-8">
                            <p className="text-sm text-muted-foreground">
                              {answer.answer}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Confidence: {Math.round(answer.confidence)}%
                            </p>
                          </div>
                        ) : (
                          <div className="ml-8 space-y-2">
                            {/* Input field for manual answer */}
                            <Label htmlFor={`answer-${index}`}>
                              {hasManualAnswer ? "Your Answer:" : "Provide Your Answer:"}
                            </Label>
                            <Input
                              id={`answer-${index}`}
                              value={manualAnswers[question] || ""}
                              onChange={(e) =>
                                handleManualAnswerChange(
                                  question,
                                  e.target.value,
                                )
                              }
                              placeholder="Type your answer here..."
                              className={hasManualAnswer ? "border-green-300" : ""}
                            />
                            
                            {/* Record specific answer button */}
                            <div className="flex items-center gap-2 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => startSpecificRecording(question)}
                                disabled={isRecording}
                              >
                                <Camera className="h-3 w-3 mr-1" />
                                Record This Answer
                              </Button>
                              {hasManualAnswer && (
                                <p className="text-xs text-green-600">
                                  Manual answer provided
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {isAnswered ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
  );
}
