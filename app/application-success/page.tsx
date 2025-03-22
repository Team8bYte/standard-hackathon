"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  ThumbsUp, 
  ThumbsDown, 
  Info, 
  AlertCircle, 
  CalendarCheck, 
  Clock, 
  File, 
  ArrowRight,
  Download,
  Share2,
  MessageSquare,
  HomeIcon,
  ListTodo,
  Loader2,
  Share
} from "lucide-react"
import Link from "next/link"
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { getUserItem, clearCurrentUserData, getCurrentUser } from "@/lib/user-data"
import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'

// Add jsPDF autotable type declaration
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type ApplicationStatus = "draft" | "submitted" | "approved" | "rejected"

interface ApplicationData {
  id: string
  applicantId: string
  personalInfo: {
    fullName: string
    aadhaarNumber: string
    panNumber: string
    dateOfBirth: string
    gender: string
    address: string
  }
  status: ApplicationStatus
  submittedAt?: string
}

interface ApprovalResult {
  approvalChance: number
  factors: {
    positive: string[]
    negative: string[]
    recommendations: string[]
    riskLevel: 'low' | 'medium' | 'high'
  }
  approved: boolean
}

export default function ApplicationSuccessPage() {
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null)
  const [nextSteps, setNextSteps] = useState<string[]>([
    "Our team will review your application within 2-3 business days",
    "You'll receive an email notification when your application status changes",
    "Prepare any additional documents mentioned in the recommendations"
  ])
  const [isLoading, setIsLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { width, height } = useWindowSize()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Load data from localStorage
    setIsLoading(true)
    
    setTimeout(() => {
      try {
        // Get application data and approval result using utility functions
        const applicationData = getUserItem<ApplicationData>("currentApplication");
        const approvalResult = getUserItem<ApprovalResult>("approvalResult");
        
        if (applicationData && approvalResult) {
          setApplicationData(applicationData);
          setApprovalResult(approvalResult);
        } else {
          // Fallback to mock data if localStorage data is not available
          const mockApplicationData: ApplicationData = {
            id: "APP-1742589178092",
            applicantId: "APID-29481",
            personalInfo: {
              fullName: "John Smith",
              aadhaarNumber: "1234 5678 9012",
              panNumber: "ABCTY1234D",
              dateOfBirth: "1990-01-15",
              gender: "Male",
              address: "123 Main Street, Mumbai, Maharashtra",
            },
            status: "submitted",
            submittedAt: new Date().toISOString()
          }
          
          const mockApprovalResult: ApprovalResult = {
            approvalChance: 20,
            factors: {
              positive: [
                "The applicant is seeking a loan for a legitimate purpose, such as buying a home",
                "The preferred loan repayment period of 10 years is reasonable and allows for manageable monthly payments"
              ],
              negative: [
                "The applicant's annual income of 40,000 rupees is extremely low and may not be sufficient to support loan repayments",
                "The applicant is currently unemployed, which significantly increases the risk of default"
              ],
              recommendations: [
                "Provide complete financial details",
                "Consider applying for a smaller loan amount",
                "Seek employment before reapplying",
                "Add a co-signer with stable income to improve chances"
              ],
              riskLevel: "high"
            },
            approved: false
          }
          
          setApplicationData(mockApplicationData)
          setApprovalResult(mockApprovalResult)
        }
      } catch (error) {
        console.error("Error loading application data:", error)
      } finally {
        setIsLoading(false)
      }
    }, 800)

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  // Check for authentication and redirect if missing data
  useEffect(() => {
    // Need to check for 3 things:
    // 1. User authentication
    // 2. Application data
    // 3. Approval result
    const user = getCurrentUser();
    const applicationData = getUserItem<ApplicationData>("currentApplication");
    const approvalResult = getUserItem<ApprovalResult>("approvalResult");
    
    if (!user || (!applicationData && !approvalResult)) {
      // If we're missing critical data, redirect to home
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, []);

  // Function to handle returning home and clearing application data
  const handleReturnHome = () => {
    // Clear all user-specific data using utility function
    clearCurrentUserData();
    
    // Clear general keys as well
    localStorage.removeItem("currentApplication");
    localStorage.removeItem("approvalResult");
    
    // Keep submitted applications for the admin panel
  }

  // Helper function to determine color based on approval chance
  const getApprovalColor = (chance: number) => {
    if (chance >= 70) return "text-green-600"
    if (chance >= 40) return "text-amber-500"
    return "text-red-600"
  }

  // Helper function to determine background color for progress bar
  const getProgressColor = (chance: number) => {
    if (chance >= 70) return "bg-green-500"
    if (chance >= 40) return "bg-amber-500"
    return "bg-red-500"
  }
  
  // Get color based on risk level
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-amber-100 text-amber-700' 
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Function to generate and download PDF
  const generatePDF = () => {
    setIsGeneratingPDF(true);
    
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(24);
      doc.setTextColor(0, 102, 204);
      doc.text("Loan Application Summary", pageWidth / 2, 20, { align: "center" });
      
      // Add application ID
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Application ID: ${applicationData?.id || "N/A"}`, pageWidth / 2, 30, { align: "center" });
      
      // Add current date
      const currentDate = new Date().toLocaleDateString();
      doc.text(`Generated on: ${currentDate}`, pageWidth / 2, 38, { align: "center" });
      
      // Add horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 42, pageWidth - 20, 42);
      
      // Add status badge
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Application Status:", 20, 55);
      
      const statusText = approvalResult?.approved ? "APPROVED" : "REJECTED";
      const statusColor = approvalResult?.approved ? [0, 153, 51] : [204, 51, 0];
      
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(80, 50, 45, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(statusText, 102, 57, { align: "center" });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Add applicant information
      doc.setFontSize(16);
      doc.text("Applicant Information", 20, 75);
      
      const applicantData = [
        ["Full Name", applicationData?.personalInfo.fullName || "N/A"],
        ["Aadhaar Number", applicationData?.personalInfo.aadhaarNumber || "N/A"],
        ["PAN Number", applicationData?.personalInfo.panNumber || "N/A"],
        ["Date of Birth", applicationData?.personalInfo.dateOfBirth || "N/A"],
        ["Gender", applicationData?.personalInfo.gender || "N/A"],
        ["Address", applicationData?.personalInfo.address || "N/A"]
      ];
      
      // Apply the autoTable plugin to the document instance
      autoTable(doc, {
        startY: 80,
        head: [["Field", "Value"]],
        body: applicantData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        margin: { left: 20, right: 20 }
      });
      
      // Add loan details
      let currentY = (doc as any).previousAutoTable.finalY + 15;
      
      doc.setFontSize(16);
      doc.text("Loan Assessment", 20, currentY);
      currentY += 10;
      
      // Add approval probability
      doc.setFontSize(14);
      doc.text(`Approval Probability: ${approvalResult?.approvalChance || 0}%`, 20, currentY);
      currentY += 10;
      
      // Add risk level
      const riskLevel = approvalResult?.factors.riskLevel.toUpperCase() || "N/A";
      doc.text(`Risk Level: ${riskLevel}`, 20, currentY);
      currentY += 15;
      
      // Add factors affecting decision
      doc.setFontSize(14);
      doc.text("Factors Affecting Decision:", 20, currentY);
      currentY += 10;
      
      // Positive factors
      doc.setTextColor(0, 153, 51);
      doc.setFontSize(12);
      doc.text("Positive Factors:", 25, currentY);
      currentY += 7;
      
      const positiveFactors = approvalResult?.factors.positive || ["No positive factors identified"];
      positiveFactors.forEach((factor: string) => {
        doc.text(`• ${factor}`, 30, currentY);
        currentY += 7;
      });
      
      currentY += 5;
      
      // Negative factors
      doc.setTextColor(204, 51, 0);
      doc.text("Negative Factors:", 25, currentY);
      currentY += 7;
      
      const negativeFactors = approvalResult?.factors.negative || ["No negative factors identified"];
      negativeFactors.forEach((factor: string) => {
        doc.text(`• ${factor}`, 30, currentY);
        currentY += 7;
      });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      currentY += 5;
      
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      // Recommendations
      doc.setFontSize(16);
      doc.text("Recommendations:", 20, currentY);
      currentY += 10;
      
      doc.setFontSize(12);
      const recommendations = approvalResult?.factors.recommendations || ["No specific recommendations available."];
      recommendations.forEach((rec: string) => {
        doc.text(`• ${rec}`, 25, currentY);
        currentY += 7;
      });
      
      // Add footer with page numbers
      const pageCount = doc.internal.pages.length - 1; // Pages array is 1-indexed
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      }
      
      // Save the PDF
      doc.save(`Loan_Application_${applicationData?.id || "Summary"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating your PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-background/80">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium">Loading your application...</h3>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we retrieve your details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-8 px-4 sm:px-6 lg:px-8">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
      
      <div className="max-w-4xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-600">Application Submitted Successfully!</h1>
          <p className="text-lg mt-2">Your application has been submitted successfully. Our team will review your application and contact you soon.</p>
        </div>
        
        {/* Application Card */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="bg-primary py-4 px-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary-foreground">Application Details</h2>
              <Badge variant="secondary" className="text-xs font-medium uppercase">
                {applicationData?.status || 'Submitted'}
              </Badge>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">APPLICANT INFORMATION</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                    <dd className="mt-1 text-base">{applicationData?.personalInfo.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Aadhaar Number</dt>
                    <dd className="mt-1 text-base">{applicationData?.personalInfo.aadhaarNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">PAN Number</dt>
                    <dd className="mt-1 text-base">{applicationData?.personalInfo.panNumber}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">APPLICATION DETAILS</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Application ID</dt>
                    <dd className="mt-1 text-base font-mono">{applicationData?.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Submission Date</dt>
                    <dd className="mt-1 text-base">
                      {applicationData?.submittedAt 
                        ? new Date(applicationData.submittedAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Reference Number</dt>
                    <dd className="mt-1 text-base font-mono">{applicationData?.applicantId}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <CalendarCheck className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-sm">Submitted</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-sm">Under Review</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <File className="h-5 w-5 mr-2" />
                  <span className="text-sm">Decision</span>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button 
                  onClick={generatePDF} 
                  className="flex items-center justify-center space-x-2"
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button variant="outline" className="flex items-center justify-center space-x-2">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Approval Chances Card */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="bg-primary py-4 px-6">
            <h2 className="text-xl font-semibold text-primary-foreground">Loan Approval Assessment</h2>
          </div>
          
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-medium">Approval Probability</h3>
                <div className="flex items-center">
                  <span className={`text-2xl font-bold ${getApprovalColor(approvalResult?.approvalChance || 0)}`}>
                    {approvalResult?.approvalChance || 0}%
                  </span>
                  <Badge 
                    className={`ml-3 ${getRiskLevelColor(approvalResult?.factors.riskLevel || 'medium')}`}
                  >
                    {approvalResult?.factors.riskLevel?.toUpperCase() || 'MEDIUM'} RISK
                  </Badge>
                </div>
              </div>
              
              <Progress 
                value={approvalResult?.approvalChance || 0} 
                className="h-3 mb-1" 
                indicatorClassName={getProgressColor(approvalResult?.approvalChance || 0)}
              />
              
              <p className="text-xs text-muted-foreground italic mt-1">
                This is an initial assessment based on your provided information. Final approval decision may vary after complete verification.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-green-700">
                  <ThumbsUp className="h-4 w-4" />
                  Positive Factors
                </h4>
                <ul className="space-y-2">
                  {approvalResult?.factors.positive.map((factor, i) => (
                    <li key={i} className="flex items-start text-sm bg-green-50 p-3 rounded-md">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-red-700">
                  <ThumbsDown className="h-4 w-4" />
                  Concerns
                </h4>
                <ul className="space-y-2">
                  {approvalResult?.factors.negative.map((factor, i) => (
                    <li key={i} className="flex items-start text-sm bg-red-50 p-3 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 text-blue-700 mb-3">
                <Info className="h-4 w-4" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {approvalResult?.factors.recommendations.map((recommendation, i) => (
                  <li key={i} className="flex items-start text-sm">
                    <div className="mr-2 mt-0.5 h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* Next Steps Card */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="bg-primary py-4 px-6">
            <h2 className="text-xl font-semibold text-primary-foreground">Next Steps</h2>
          </div>
          
          <CardContent className="p-6">
            <ol className="space-y-4">
              {nextSteps.map((step, i) => (
                <li key={i} className="flex items-start">
                  <div className="mr-3 mt-1 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-base">{step}</p>
                  </div>
                </li>
              ))}
            </ol>
            
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <Button className="gap-2" asChild>
                  <Link href="/application-status">
                    <ListTodo className="h-4 w-4" />
                    Track Application
                  </Link>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <Link href="/contact">
                    <MessageSquare className="h-4 w-4" />
                    Contact Support
                  </Link>
                </Button>
              </div>
              
              <Button variant="ghost" className="gap-2" asChild>
                <Link href="/" onClick={handleReturnHome}>
                  <HomeIcon className="h-4 w-4" />
                  Return to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 