import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, SkipForward, MessageSquare, Video, Globe2, Loader2, AlertTriangle } from "lucide-react"

type Language = "english" | "hindi" | "marathi" | "gujarati" | "tamil"

const SEGMENTS = [
  {
    id: 1,
    title: "Loan Purpose",
    question: "What is the purpose of your loan?",
    videoPath: {
      english: "/videos/support/v1/english.mp4",
      hindi: "/videos/support/v1/hindi.mp4",
      marathi: "/videos/support/v1/marathi.mp4",
      gujarati: "/videos/support/v1/guju.mp4",
      tamil: "/videos/support/tamil.mp4"
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
      gujarati: "/videos/support/v2/guju.mp4",
      tamil: "/videos/support/tamil.mp4"
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
      gujarati: "/videos/support/v3/guju.mp4",
      tamil: "/videos/support/tamil.mp4"
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
      gujarati: "/videos/support/v4/guju.mp4",
      tamil: "/videos/support/tamil.mp4"
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
      gujarati: "/videos/support/v5/guju.mp4",
      tamil: "/videos/support/tamil.mp4"
    }
  }
]

// Language labels for questions (to display questions in selected language)
const LANGUAGE_QUESTIONS = {
  english: {
    "Loan Purpose": "What is the purpose of your loan?",
    "Income & Employment": "What is your annual income and current employment?",
    "Document Upload": "Please upload your Aadhaar, PAN, and salary slip for verification",
    "CIBIL Score": "What is your CIBIL score?",
    "Disbursement Preference": "If the loan is approved, would you like to receive the amount directly in your bank account or through demand draft?"
  },
  hindi: {
    "Loan Purpose": "आपके ऋण का उद्देश्य क्या है?",
    "Income & Employment": "आपकी वार्षिक आय और वर्तमान रोजगार क्या है?",
    "Document Upload": "कृपया सत्यापन के लिए अपना आधार, पैन और वेतन पर्ची अपलोड करें",
    "CIBIL Score": "आपका सिबिल स्कोर क्या है?",
    "Disbursement Preference": "यदि ऋण स्वीकृत हो जाता है, तो क्या आप सीधे अपने बैंक खाते में या डिमांड ड्राफ्ट के माध्यम से राशि प्राप्त करना चाहेंगे?"
  },
  marathi: {
    "Loan Purpose": "तुमच्या कर्जाचा हेतू काय आहे?",
    "Income & Employment": "तुमचे वार्षिक उत्पन्न आणि सध्याचे रोजगार काय आहे?",
    "Document Upload": "कृपया सत्यापनासाठी तुमचा आधार, पॅन आणि पगार स्लिप अपलोड करा",
    "CIBIL Score": "तुमचा सिबिल स्कोर काय आहे?",
    "Disbursement Preference": "कर्ज मंजूर झाल्यास, तुम्हाला थेट तुमच्या बँक खात्यात किंवा डिमांड ड्राफ्टद्वारे रक्कम मिळवायला आवडेल का?"
  },
  gujarati: {
    "Loan Purpose": "તમારી લોનનો હેતુ શું છે?",
    "Income & Employment": "તમારી વાર્ષિક આવક અને વર્તમાન રોજગાર શું છે?",
    "Document Upload": "કૃપા કરીને ચકાસણી માટે તમારો આધાર, પાન અને પગાર સ્લિપ અપલોડ કરો",
    "CIBIL Score": "તમારો સિબિલ સ્કોર શું છે?",
    "Disbursement Preference": "જો લોન મંજૂર થાય, તો શું તમે સીધા તમારા બેંક ખાતામાં અથવા ડિમાન્ડ ડ્રાફ્ટ દ્વારા રકમ મેળવવા માંગો છો?"
  },
  tamil: {
    "Loan Purpose": "உங்கள் கடனின் நோக்கம் என்ன?",
    "Income & Employment": "உங்கள் ஆண்டு வருமானம் மற்றும் தற்போதைய வேலை என்ன?",
    "Document Upload": "சரிபார்ப்புக்காக உங்கள் ஆதார், பான் மற்றும் சம்பளச் சீட்டை பதிவேற்றவும்",
    "CIBIL Score": "உங்கள் சிபில் மதிப்பெண் என்ன?",
    "Disbursement Preference": "கடன் அங்கீகரிக்கப்பட்டால், தொகையை நேரடியாக உங்கள் வங்கிக் கணக்கில் அல்லது டிமாண்ட் டிராஃப்ட் மூலம் பெற விரும்புகிறீர்களா?"
  }
}

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
    // Clear previous responses when language changes
    setAiResponse("")
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
          language: selectedLanguage, // Pass the selected language to the API
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
  
  // Get the localized question for the current segment and language
  const getLocalizedQuestion = () => {
    const segmentTitle = SEGMENTS[currentSegment].title;
    const languageQuestions = LANGUAGE_QUESTIONS[selectedLanguage] || LANGUAGE_QUESTIONS["english"];
    return languageQuestions[segmentTitle as keyof typeof languageQuestions] || SEGMENTS[currentSegment].question;
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
            <option value="tamil">தமிழ்</option>
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
            {getLocalizedQuestion()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder={selectedLanguage === "english" ? "Type your answer here..." : 
                selectedLanguage === "hindi" ? "अपना उत्तर यहां टाइप करें..." :
                selectedLanguage === "marathi" ? "तुमचे उत्तर येथे टाइप करा..." :
                selectedLanguage === "gujarati" ? "તમારો જવાબ અહીં ટાઇપ કરો..." :
                "உங்கள் பதிலை இங்கே தட்டச்சு செய்யவும்..."}
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