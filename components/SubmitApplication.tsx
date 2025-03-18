import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, FileCheck, User, AlertTriangle, Files } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ApplicationData = {
  userData: {
    applicantId: string;
    loanApplicationId: string;
    timestamp: string;
  };
  financialAnswers: Array<{
    question: string;
    answer: string;
    confidence: number;
  }>;
  documents: Array<{
    type: string;
    name: string;
    status: string;
    verifiedAt?: string;
  }>;
};

export default function SubmitApplication() {
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load user data
      const userDataJson = localStorage.getItem('currentUserData');
      const financialAnswersJson = localStorage.getItem('financialAnswers');
      const documentsJson = localStorage.getItem('verifiedDocuments');

      if (userDataJson && financialAnswersJson) {
        setApplicationData({
          userData: JSON.parse(userDataJson),
          financialAnswers: JSON.parse(financialAnswersJson),
          documents: documentsJson ? JSON.parse(documentsJson) : []
        });
      }
    }
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Here you would typically send the data to your backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated API call
      
      // Clear application data from localStorage
      localStorage.removeItem('financialAnswers');
      
      setIsSubmitted(true);
      setShowDialog(true);
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!applicationData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Application Data Not Found</h3>
        <p className="text-muted-foreground">
          Please complete the previous steps before submitting your application.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Application Submitted Successfully!</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your loan application has been submitted. We will review your application and contact you soon.
                </p>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-medium">Application Reference:</div>
                  <div className="text-sm">{applicationData.userData.loanApplicationId}</div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => window.location.href = '/'}>
              Return to Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Application Review
          </CardTitle>
          <CardDescription>
            Review your application details before final submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Applicant Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Applicant ID</p>
                  <p className="text-sm text-muted-foreground">{applicationData.userData.applicantId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Application ID</p>
                  <p className="text-sm text-muted-foreground">{applicationData.userData.loanApplicationId}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Started</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(applicationData.userData.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Document Verification Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Files className="h-5 w-5" />
                Verified Documents
              </h3>
              <div className="space-y-3">
                {applicationData.documents.map((doc, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Verified: {doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                    <FileCheck className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Financial Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-4">
                  {applicationData.financialAnswers.map((answer, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg">
                      <p className="font-medium text-sm">{answer.question}</p>
                      <p className="mt-1 text-sm">{answer.answer}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Please review all information carefully before submitting
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="flex items-center gap-2" disabled={isSubmitting || isSubmitted}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  Submitting...
                </>
              ) : isSubmitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submitted
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Loan Application</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to submit your loan application? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 