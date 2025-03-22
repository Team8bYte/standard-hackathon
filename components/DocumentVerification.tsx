import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileCheck,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Camera,
  XCircle,
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
import Webcam from "react-webcam";

type Document = {
  id: string;
  name: string;
  type: string;
  status: "uploading" | "processing" | "uploaded" | "failed";
  error?: string;
};

type DocumentVerificationProps = {
  onComplete?: () => void;
};

const REQUIRED_DOCUMENTS = [
  {
    type: "aadhaar_card",
    name: "Aadhaar Card",
    description: "Upload your Aadhar card to ease up your application",
    formats: "PNG, JPG, or PDF",
  },
  {
    type: "pan_card",
    name: "PAN Card",
    description: "Upload your PAN card",
    formats: "PNG, JPG, or PDF",
  },
  // {
  //   type: "bank_statements",
  //   name: "Bank Statements",
  //   description: "Last 3 months of bank statements",
  //   formats: "PNG, JPG, or PDF",
  // },
  // {
  //   type: "utility_bill",
  //   name: "Proof of Address",
  //   description: "Recent utility bill or lease agreement",
  //   formats: "PNG, JPG, or PDF",
  // },
];

export default function DocumentVerification({
  onComplete,
}: DocumentVerificationProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({
    title: "",
    description: "",
  });
  const [isComplete, setIsComplete] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [currentDocType, setCurrentDocType] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const { updateFormData } = useOurFormContext();

  // Check if all required documents are uploaded
  const checkCompletion = useCallback(() => {
    const allDocumentsVerified = REQUIRED_DOCUMENTS.every((required) =>
      documents.some(
        (doc) => doc.type === required.type && doc.status === "uploaded",
      ),
    );
    setIsComplete(allDocumentsVerified);
    return allDocumentsVerified;
  }, [documents]);

  // Handle file upload
  const handleFileUpload = async (type: string, file: File) => {
    const id = `${type}-${Date.now()}`;

    // Add document to state with uploading status
    setDocuments((prev) => [
      ...prev.filter((d) => d.type !== type),
      {
        id,
        name: file.name,
        type,
        status: "uploading",
      },
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const url = (() => {
        switch (type) {
          case "pan_card":
            return "/api/process-pan";
          case "aadhaar_card":
            return "/api/process-aadhaar";
          default:
            return "";
        }
      })();

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process document");
      }

      if (type === "aadhaar_card") {
        updateFormData({ ...data.data });
      } else if (type === "pan_card") {
        updateFormData({ pan_number: data.data.pan_number as string });
      }
      // Update document status to processing
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, status: "processing" } : doc,
        ),
      );

      // Simulate document verification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update document status to verified
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, status: "uploaded" } : doc,
        ),
      );

      // Check if all documents are now verified
      if (checkCompletion()) {
        setAlertMessage({
          title: "All Documents Verified",
          description: "You can now proceed with your application.",
        });
        setAlertOpen(true);
      }
    } catch (error) {
      // Handle upload/verification failure
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id
            ? { ...doc, status: "failed", error: "Not a valid document!" }
            : doc,
        ),
      );

      setAlertMessage({
        title: "Document Verification Failed",
        description: "Please try uploading the document again.",
      });
      setAlertOpen(true);
    }
  };

  // Handle file selection
  const handleFileSelect =
    (type: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileUpload(type, file);
      }
    };

  // Remove a document
  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    checkCompletion();
  };

  // Retry failed upload
  const retryUpload = (type: string) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".png,.jpg,.jpeg,.pdf";
    fileInput.onchange = (e) => handleFileSelect(type)(e as any);
    fileInput.click();
  };

  // Toggle webcam for a specific document type
  const toggleWebcam = (type: string) => {
    if (webcamActive && currentDocType === type) {
      setWebcamActive(false);
      setCurrentDocType(null);
    } else {
      setWebcamActive(true);
      setCurrentDocType(type);
    }
  };

  // Capture image from webcam
  const captureImage = () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc || !currentDocType) return;
    
    // Convert base64 to file
    const blob = dataURLtoBlob(imageSrc);
    const file = new File([blob], `${currentDocType}_capture.jpg`, { type: 'image/jpeg' });
    
    // Process the captured image
    handleFileUpload(currentDocType, file);
    
    // Close webcam after capture
    setWebcamActive(false);
    setCurrentDocType(null);
  };

  // Convert data URL to Blob
  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
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

      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
          <CardDescription>
            Please upload the required documents for your loan application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webcamActive && currentDocType && (
            <div className="mb-6 border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">
                  Take a picture of your {
                    REQUIRED_DOCUMENTS.find(doc => doc.type === currentDocType)?.name
                  }
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleWebcam(currentDocType)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
              
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "environment", // Use back camera for documents
                }}
                className="w-full h-auto rounded-lg border"
                screenshotQuality={1}
              />
              
              <div className="mt-3 flex justify-center">
                <Button onClick={captureImage}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Image
                </Button>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-700 mb-2">Tips for a clear document photo:</h5>
                <ul className="text-xs text-blue-600 list-disc pl-5 space-y-1">
                  <li>Place your document on a dark, non-reflective surface</li>
                  <li>Ensure all four corners of the document are visible</li>
                  <li>Make sure text is clearly readable</li>
                  <li>Avoid shadows and glare on the document</li>
                  <li>Hold your device steady when taking the photo</li>
                </ul>
              </div>
            </div>
          )}

          <ScrollArea className="rounded-md border p-4">
            <div className="space-y-4">
              {REQUIRED_DOCUMENTS.map((doc) => {
                const uploadedDoc = documents.find((d) => d.type === doc.type);

                return (
                  <div key={doc.type} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accepted formats: {doc.formats}
                        </p>
                      </div>

                      {!uploadedDoc && !webcamActive && (
                        <div className="flex space-x-2">
                          <input
                            type="file"
                            id={`file-${doc.type}`}
                            className="hidden"
                            accept=".png,.jpg,.jpeg,.pdf"
                            onChange={handleFileSelect(doc.type)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document
                                .getElementById(`file-${doc.type}`)
                                ?.click()
                            }
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWebcam(doc.type)}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Take Photo
                          </Button>
                        </div>
                      )}
                    </div>

                    {uploadedDoc && (
                      <div className="mt-4 bg-muted/30 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {uploadedDoc.status === "uploaded" && (
                              <FileCheck className="h-4 w-4 text-green-500" />
                            )}
                            {uploadedDoc.status === "failed" && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            {(uploadedDoc.status === "uploading" ||
                              uploadedDoc.status === "processing") && (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            )}
                            <span className="text-sm">{uploadedDoc.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {uploadedDoc.status === "failed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => retryUpload(doc.type)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(uploadedDoc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {uploadedDoc.status === "uploading" && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Uploading document...
                          </p>
                        )}
                        {uploadedDoc.status === "processing" && (
                          <p className="text-xs text-blue-500 mt-2 flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Processing document and extracting information...
                          </p>
                        )}
                        {uploadedDoc.status === "failed" &&
                          uploadedDoc.error && (
                            <p className="text-xs text-red-500 mt-2">
                              {uploadedDoc.error}
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {isComplete
            ? "All required documents have been verified. You can proceed with your application."
            : "Please upload and verify all required documents to continue."}
        </p>
        <Button
          onClick={() => onComplete?.()}
          disabled={!isComplete}
          className="flex items-center gap-2"
        >
          Continue Application
          {isComplete && <FileCheck className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
