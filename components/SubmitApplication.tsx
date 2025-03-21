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
  ThumbsUp,
  ThumbsDown,
  Info,
  AlertCircle,
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
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { getUserItem, setUserItem, getCurrentUser } from "@/lib/user-data";

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

interface ApprovalResult {
  approvalChance: number;
  factors: {
    positive: string[];
    negative: string[];
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export default function SubmitApplication() {
  const { formData, updateFormData } = useOurFormContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"save" | "submit">("save");
  const [financialAnswers, setFinancialAnswers] = useState<Array<{ question: string; answer: string }>>([]);
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);
  const [isCalculatingApproval, setIsCalculatingApproval] = useState(false);
  const router = useRouter();

  // Load financial answers from localStorage
  useEffect(() => {
    const savedAnswers = getUserItem<Array<any>>("financialAnswers");
    
    if (savedAnswers) {
      // Ensure we get an array of objects with question and answer properties
      const formattedAnswers = savedAnswers.map(answer => ({
        question: answer.question,
        answer: answer.manualAnswer || answer.answer || "Not provided"
      }));
      
      setFinancialAnswers(formattedAnswers);
      
      // Update form context with financial answers
      formattedAnswers.forEach((answer, index) => {
        updateFormData({ [`financial_answer_${index}`]: answer.answer });
      });
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const applicationId = `APP-${Date.now()}`;
      // Get current user ID if available
      const currentUser = getCurrentUser();
      const applicantId = currentUser?.applicantId || applicationId;
      
      const applicationData: ApplicationData = {
        id: applicationId,
        applicantId: applicantId,
        personalInfo: {
          fullName: formData.full_name || "",
          aadhaarNumber: formData.aadhaar_number || "",
          panNumber: formData.pan_number || "",
          dateOfBirth: formData.date_of_birth || "",
          gender: formData.gender || "",
          address: formData.address || "",
        },
        financialInfo: financialAnswers,
        documents: [],
        status: "draft",
      };

      // Save application data with user-specific key
      setUserItem("applicationData", applicationData);
      
      setIsSaved(true);
      setDialogType("save");
      setShowDialog(true);
    } catch (error) {
      console.error("Error saving form:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateApprovalChance = async (applicationData: ApplicationData) => {
    setIsCalculatingApproval(true);
    try {
      const response = await fetch("/api/calculate-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalInfo: applicationData.personalInfo,
          financialInfo: applicationData.financialInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate approval chance");
      }

      let result = await response.json();
      
      // Validate and ensure result has the required structure
      const defaultResult = {
        approvalChance: 50,
        factors: {
          positive: ["Application received and under review"],
          negative: ["Incomplete financial information"],
          recommendations: ["Provide complete financial details"],
          riskLevel: "medium" as 'low' | 'medium' | 'high'
        }
      };

      // Validate result structure
      if (typeof result !== 'object' || result === null) {
        result = defaultResult;
      } else {
        // Ensure approvalChance is a number
        if (typeof result.approvalChance !== 'number' || isNaN(result.approvalChance)) {
          result.approvalChance = defaultResult.approvalChance;
        }

        // Ensure factors exist
        if (!result.factors || typeof result.factors !== 'object') {
          result.factors = defaultResult.factors;
        } else {
          // Check and provide defaults for arrays
          if (!Array.isArray(result.factors.positive)) {
            result.factors.positive = defaultResult.factors.positive;
          }
          if (!Array.isArray(result.factors.negative)) {
            result.factors.negative = defaultResult.factors.negative;
          }
          if (!Array.isArray(result.factors.recommendations)) {
            result.factors.recommendations = defaultResult.factors.recommendations;
          }
        }
      }
      
      setApprovalResult(result);
      return result;
    } catch (error) {
      console.error("Error calculating approval chance:", error);
      // Set a default result on error
      const defaultResult = {
        approvalChance: 40,
        factors: {
          positive: ["Application received"],
          negative: ["Error processing application details"],
          recommendations: ["Please complete all required information"],
          riskLevel: "medium" as 'low' | 'medium' | 'high'
        }
      };
      setApprovalResult(defaultResult);
      return defaultResult;
    } finally {
      setIsCalculatingApproval(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const applicationId = `APP-${Date.now()}`;
      // Get current user ID if available
      const currentUser = getCurrentUser();
      const applicantId = currentUser?.applicantId || applicationId;
      
      const applicationData: ApplicationData = {
        id: applicationId,
        applicantId: applicantId,
        personalInfo: {
          fullName: formData.full_name || "",
          aadhaarNumber: formData.aadhaar_number || "",
          panNumber: formData.pan_number || "",
          dateOfBirth: formData.date_of_birth || "",
          gender: formData.gender || "",
          address: formData.address || "",
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

      // Save application with user-specific key
      setUserItem("applicationData", applicationData);

      // Calculate approval chance
      const approvalResult = await calculateApprovalChance(applicationData);
      
      // Save approval result with user-specific key
      setUserItem("approvalResult", approvalResult);
      
      // Save application data and approval result to localStorage for the success page
      // These are also used by components that haven't been updated to use the utility functions
      localStorage.setItem("currentApplication", JSON.stringify(applicationData));
      localStorage.setItem("approvalResult", JSON.stringify(approvalResult));
      
      // Redirect to success page instead of showing dialog
      router.push("/application-success");
    } catch (error) {
      console.error("Error submitting application:", error);
      setDialogType("submit");
      setShowDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to determine color based on approval chance
  const getApprovalColor = (chance: number) => {
    if (chance >= 70) return "text-green-600";
    if (chance >= 40) return "text-amber-500";
    return "text-red-600";
  };

  // Helper function to determine background color for progress bar
  const getProgressColor = (chance: number) => {
    if (chance >= 70) return "bg-green-500";
    if (chance >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-xl">
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

                {dialogType === "submit" && (
                  <div className="mt-6 space-y-4">
                    {isCalculatingApproval ? (
                      <div className="text-center py-4">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Calculating loan approval chances...</p>
                      </div>
                    ) : approvalResult ? (
                      <>
                        <div className="border rounded-lg p-4">
                          <div className="mb-2 flex justify-between items-center">
                            <h3 className="font-medium">Loan Approval Chances:</h3>
                            <span className={`font-bold text-lg ${getApprovalColor(approvalResult.approvalChance)}`}>
                              {approvalResult.approvalChance}%
                            </span>
                          </div>
                          
                          <Progress 
                            value={approvalResult.approvalChance} 
                            className="h-2 mb-4" 
                            indicatorClassName={getProgressColor(approvalResult.approvalChance)}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                                <ThumbsUp className="h-4 w-4 text-green-500" />
                                Positive Factors
                              </h4>
                              <ul className="text-sm space-y-1">
                                {approvalResult?.factors?.positive?.map((factor, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-green-500 mt-1">•</span>
                                    <span>{factor}</span>
                                  </li>
                                )) || <li>No positive factors available</li>}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                                <ThumbsDown className="h-4 w-4 text-red-500" />
                                Negative Factors
                              </h4>
                              <ul className="text-sm space-y-1">
                                {approvalResult?.factors?.negative?.map((factor, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-red-500 mt-1">•</span>
                                    <span>{factor}</span>
                                  </li>
                                )) || <li>No negative factors available</li>}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                              <Info className="h-4 w-4 text-blue-500" />
                              Recommendations
                            </h4>
                            <ul className="text-sm space-y-1">
                              {approvalResult?.factors?.recommendations?.map((recommendation, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{recommendation}</span>
                                </li>
                              )) || <li>No recommendations available</li>}
                            </ul>
                          </div>
                          
                          <div className="mt-4 p-2 border border-amber-200 bg-amber-50 rounded flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            <p className="text-xs text-amber-800">
                              This is an initial assessment based on your provided information. Final approval decision may vary after complete verification.
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 border rounded-lg bg-red-50 text-red-800 text-sm">
                        Unable to calculate approval chances at this time. Our team will review your application manually.
                      </div>
                    )}
                  </div>
                )}
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
