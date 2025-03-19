import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  FileText,
  Save,
  CheckCircle2,
  AlertTriangle,
  Send,
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useOurFormContext } from "@/contexts/FormContext";
import { FINANCIAL_QUESTIONS } from "./FinancialInformation";

type ApplicationStatus = "draft" | "submitted" | "approved" | "rejected";

interface ApplicationData {
  id: string;
  applicantId: string;
  personalInfo: {
    fullName: string;
    aadhaarNumber: string;
    panNumber: string;
    dateOfBirth: string;
    gender: string;
    address: string;
  };
  financialInfo: Array<{
    question: string;
    answer: string;
  }>;
  documents: Array<{
    type: string;
    name: string;
    status: string;
  }>;
  status: ApplicationStatus;
  submittedAt?: string;
}

export default function SubmitApplication() {
  const { formData, updateFormData } = useOurFormContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"save" | "submit">("save");
  const [financialAnswers, setFinancialAnswers] = useState<Array<{ question: string; answer: string }>>([]);

  // Load financial answers from localStorage
  useEffect(() => {
    const savedAnswers = localStorage.getItem("financialAnswers");
    if (savedAnswers) {
      const answers = JSON.parse(savedAnswers);
      setFinancialAnswers(answers);
      
      // Update form context with financial answers
      answers.forEach((answer: { question: string; answer: string }, index: number) => {
        updateFormData({ [`financial_answer_${index}`]: answer.answer });
      });
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const applicationData: ApplicationData = {
        id: `APP-${Date.now()}`,
        applicantId: formData.applicantId || `APP-${Date.now()}`,
        personalInfo: {
          fullName: formData.full_name,
          aadhaarNumber: formData.aadhaar_number,
          panNumber: formData.pan_number,
          dateOfBirth: formData.date_of_birth,
          gender: formData.gender,
          address: formData.address,
        },
        financialInfo: financialAnswers,
        documents: [],
        status: "draft",
      };

      // Save to localStorage for persistence
      localStorage.setItem("applicationData", JSON.stringify(applicationData));
      
      setIsSaved(true);
      setDialogType("save");
      setShowDialog(true);
    } catch (error) {
      console.error("Error saving form:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const applicationData: ApplicationData = {
        id: `APP-${Date.now()}`,
        applicantId: formData.applicantId || `APP-${Date.now()}`,
        personalInfo: {
          fullName: formData.full_name,
          aadhaarNumber: formData.aadhaar_number,
          panNumber: formData.pan_number,
          dateOfBirth: formData.date_of_birth,
          gender: formData.gender,
          address: formData.address,
        },
        financialInfo: financialAnswers,
        documents: [],
        status: "submitted",
        submittedAt: new Date().toISOString(),
      };

      // Save to localStorage for admin panel
      const existingApplications = JSON.parse(localStorage.getItem("submittedApplications") || "[]");
      existingApplications.push(applicationData);
      localStorage.setItem("submittedApplications", JSON.stringify(existingApplications));

      setDialogType("submit");
      setShowDialog(true);
    } catch (error) {
      console.error("Error submitting application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogType === "save" ? "Application Saved Successfully!" : "Application Submitted Successfully!"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {dialogType === "save" 
                    ? "Your application information has been saved. You can continue editing or submit your application when ready."
                    : "Your application has been submitted successfully. Our team will review your application and contact you soon."}
                </p>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-medium">Application Details:</div>
                  <div className="text-sm">Name: {formData.full_name}</div>
                  <div className="text-sm">Aadhaar: {formData.aadhaar_number}</div>
                  <div className="text-sm">Application ID: {`APP-${Date.now()}`}</div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {dialogType === "save" ? (
              <AlertDialogAction onClick={() => setShowDialog(false)}>
                Continue Editing
              </AlertDialogAction>
            ) : (
              <AlertDialogAction onClick={() => window.location.href = "/"}>
                Return to Home
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Enter your personal details for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => updateFormData({ full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
              <Input
                id="aadhaar_number"
                value={formData.aadhaar_number}
                onChange={(e) =>
                  updateFormData({ aadhaar_number: e.target.value })
                }
                placeholder="12-digit Aadhaar number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pan_number">PAN Number</Label>
              <Input
                id="pan_number"
                value={formData.pan_number}
                onChange={(e) => updateFormData({ pan_number: e.target.value })}
                placeholder="10-digit PAN number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  updateFormData({ date_of_birth: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => updateFormData({ gender: value })}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData({ address: e.target.value })}
                placeholder="Enter your complete address"
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Financial Information
          </CardTitle>
          <CardDescription>
            Review your financial information collected from the previous section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {financialAnswers.map((answer, index) => (
              <div key={index} className="space-y-2">
                <Label>{answer.question}</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{answer.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-6">
          <div>
            {!isSaved && !isSaving && (
              <p className="text-sm text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Unsaved changes
              </p>
            )}
            {isSaved && !isSaving && (
              <p className="text-sm text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                All changes saved
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              variant="outline" 
              className="flex items-center gap-2" 
              disabled={isSaving || isSubmitting}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Draft
                </>
              )}
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex items-center gap-2"
              disabled={isSaving || isSubmitting || !isSaved}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
