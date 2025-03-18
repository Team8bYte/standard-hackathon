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

export default function ApplicationForm() {
  const { formData, updateFormData, updateAnswer } = useOurFormContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    console.log(formData);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Here you would typically send the data to your backend
      console.log("Saving form data:", formData);

      setIsSaved(true);
      setShowDialog(true);
    } catch (error) {
      console.error("Error saving form:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Form Saved Successfully!</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your application information has been saved. You can continue
                  editing or submit your application when ready.
                </p>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-medium">Application Details:</div>
                  <div className="text-sm">Name: {formData.full_name}</div>
                  <div className="text-sm">
                    Aadhaar: {formData.aadhaar_number}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDialog(false)}>
              Continue Editing
            </AlertDialogAction>
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
            Please answer the following questions about your financial situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {FINANCIAL_QUESTIONS.map((question, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`question-${index}`}>{question}</Label>
                <Textarea
                  id={`question-${index}`}
                  value={formData.answers[index] || ""}
                  onChange={(e) => updateAnswer(index, e.target.value)}
                  placeholder="Type your answer here"
                  className="resize-none"
                  rows={2}
                />
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="flex items-center gap-2" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Information
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Save Application Information
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to save the current information? Make
                  sure all details are correct.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
