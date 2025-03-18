"use client"

import { useState, useEffect } from "react"
import FaceVerification from "@/components/FaceVerification"
import VideoCapture from "@/components/VideoCapture"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileCheck, CreditCard, FileText, AlertTriangle, UserPlus, User } from "lucide-react"
import * as facialVerification from "@/lib/facial-verification"

export default function VideoVerificationInterface() {
  const [videoActive, setVideoActive] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [hasEnrolledFaces, setHasEnrolledFaces] = useState(false)
  const [userAuthenticated, setUserAuthenticated] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [initStatus, setInitStatus] = useState<string>("initializing")

  // Check if facial verification is initialized and if there are any enrolled faces
  useEffect(() => {
    const checkInitStatus = async () => {
      try {
        // Initialize face-api.js
        setInitStatus("initializing");
        const initialized = await facialVerification.initFaceApi();
        
        if (initialized) {
          setInitStatus("ready");
          
          // Check if there are any enrolled faces
          const storedFacesCount = facialVerification.getStoredFacesCount();
          setHasEnrolledFaces(storedFacesCount > 0);
          console.log(`Found ${storedFacesCount} enrolled faces`);
          
          // Check local storage for user authentication status
          const savedUserData = localStorage.getItem('currentUserData');
          if (savedUserData) {
            try {
              const parsedUserData = JSON.parse(savedUserData);
              setUserData(parsedUserData);
              setUserAuthenticated(true);
              setVerificationComplete(true);
              console.log("User already authenticated:", parsedUserData);
            } catch (e) {
              console.error("Error parsing saved user data:", e);
              localStorage.removeItem('currentUserData');
            }
          }
        } else {
          setInitStatus("error");
          console.error("Failed to initialize facial verification system");
        }
      } catch (error) {
        setInitStatus("error");
        console.error("Error checking facial verification status:", error);
      }
    };

    checkInitStatus();
  }, []);

  // Handle video state change from VideoCapture component
  const handleVideoStateChange = (isActive: boolean) => {
    setVideoActive(isActive);
  };

  // Custom event listener for face verification events
  useEffect(() => {
    const handleVerificationEvent = (event: CustomEvent) => {
      const { action, success, userData } = event.detail;
      
      if (action === "enroll" && success) {
        // User has enrolled a new face
        setHasEnrolledFaces(true);
        setUserData(userData);
        setUserAuthenticated(true);
        setVerificationComplete(true);
        localStorage.setItem('currentUserData', JSON.stringify(userData));
        console.log("User enrolled successfully:", userData);
      } else if (action === "authenticate" && success) {
        // User has authenticated with an existing face
        setUserData(userData);
        setUserAuthenticated(true);
        setVerificationComplete(true);
        localStorage.setItem('currentUserData', JSON.stringify(userData));
        console.log("User authenticated successfully:", userData);
      } else if (action === "clear") {
        // All faces have been cleared
        setHasEnrolledFaces(false);
        setUserAuthenticated(false);
        setVerificationComplete(false);
        setUserData(null);
        localStorage.removeItem('currentUserData');
        console.log("All faces cleared");
      }
    };
    
    // Add custom event listener
    window.addEventListener('faceVerificationEvent', handleVerificationEvent as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('faceVerificationEvent', handleVerificationEvent as EventListener);
    };
  }, []);

  // Next step in application process
  const goToNextStep = () => {
    if (currentStep < applicationSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Log out (clear current user)
  const logOut = () => {
    setUserAuthenticated(false);
    setVerificationComplete(false);
    setUserData(null);
    setHasEnrolledFaces(false);
    setCurrentStep(1);
    localStorage.removeItem('currentUserData');
  };

  // Steps of the loan application process
  const applicationSteps = [
    { id: 1, name: "Identity Verification", icon: FileCheck },
    { id: 2, name: "Financial Information", icon: CreditCard, disabled: !verificationComplete },
    { id: 3, name: "Submit Application", icon: FileText, disabled: !verificationComplete }
  ];

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Secure Bank Loan Application</h1>
        
        {userAuthenticated && userData && (
          <div className="flex items-center">
            <div className="text-right mr-4">
              <p className="font-medium">{userData.applicantId}</p>
              <p className="text-sm text-muted-foreground">Application ID: {userData.loanApplicationId}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logOut}>Log Out</Button>
          </div>
        )}
      </div>
      
      {/* Application steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {applicationSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === step.id ? 'bg-primary text-primary-foreground' : 
                currentStep > step.id ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`ml-3 text-sm ${
                step.disabled ? 'text-muted-foreground' : 'font-medium'
              }`}>
                {step.name}
              </span>
              {index < applicationSteps.length - 1 && (
                <div className={`w-24 h-1 mx-4 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Show verification interface only if not yet authenticated */}
      {!userAuthenticated ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="order-1 md:order-1">
            <FaceVerification videoActive={videoActive} />
          </div>
          <div className="order-2 md:order-2">
            <VideoCapture onVideoStateChange={handleVideoStateChange} />
          </div>
        </div>
      ) : (
        <div className="p-6 border rounded-lg bg-green-50 mb-6">
          <div className="flex items-start">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FileCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-green-800">Identity Verification Complete</h2>
              <p className="text-green-700 mt-1">
                Your identity has been verified. You can now proceed with your loan application.
              </p>
              {userData && (
                <div className="mt-2 p-3 bg-white rounded-md text-sm">
                  <p><strong>Applicant ID:</strong> {userData.applicantId}</p>
                  <p><strong>Application ID:</strong> {userData.loanApplicationId}</p>
                  <p><strong>Started:</strong> {new Date(userData.timestamp).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between items-center">
        <div>
          {!verificationComplete ? (
            <p className="text-muted-foreground">
              Please complete identity verification to continue your loan application.
            </p>
          ) : (
            <p className="text-green-600 flex items-center">
              <FileCheck className="mr-2 h-5 w-5" />
              Identity verification successful! You can now proceed with your application.
            </p>
          )}
        </div>
        
        <div className="flex space-x-4">
          {!userAuthenticated && hasEnrolledFaces && (
            <Button 
              variant="outline" 
              onClick={() => {
                // Trigger the event manually (in real app, this would come from FaceVerification)
                const event = new CustomEvent('faceVerificationEvent', {
                  detail: {
                    action: 'authenticate',
                    success: true,
                    userData: {
                      applicantId: `applicant-${Date.now()}`,
                      loanApplicationId: `loan-${Date.now()}`,
                      email: "applicant@example.com",
                      timestamp: new Date().toISOString()
                    }
                  }
                });
                window.dispatchEvent(event);
              }}
              className="flex items-center"
              disabled={!videoActive}
            >
              <User className="mr-2 h-4 w-4" />
              Continue Existing Application
            </Button>
          )}
          
          {!userAuthenticated && !hasEnrolledFaces && (
            <Button 
              variant="outline" 
              onClick={() => {
                // Trigger the event manually (in real app, this would come from FaceVerification)
                const event = new CustomEvent('faceVerificationEvent', {
                  detail: {
                    action: 'enroll',
                    success: true,
                    userData: {
                      applicantId: `applicant-${Date.now()}`,
                      loanApplicationId: `loan-${Date.now()}`,
                      email: "applicant@example.com",
                      timestamp: new Date().toISOString()
                    }
                  }
                });
                window.dispatchEvent(event);
              }}
              className="flex items-center"
              disabled={!videoActive}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          )}
          
          <Button 
            onClick={goToNextStep} 
            disabled={!verificationComplete || currentStep >= applicationSteps.length}
            className="flex items-center"
          >
            Continue Application <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Financial Information Step (Placeholder) */}
      {currentStep === 2 && (
        <div className="mt-8 p-6 border rounded-lg">
          <h2 className="text-xl font-bold mb-4">Financial Information</h2>
          <p className="mb-4 text-muted-foreground">
            This section would collect financial details for your loan application.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">Placeholder for financial information form</p>
          </div>
        </div>
      )}
      
      {/* Submit Application Step (Placeholder) */}
      {currentStep === 3 && (
        <div className="mt-8 p-6 border rounded-lg">
          <h2 className="text-xl font-bold mb-4">Submit Application</h2>
          <p className="mb-4 text-muted-foreground">
            Review your information and submit your loan application.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">Placeholder for application review and submission</p>
          </div>
        </div>
      )}
    </div>
  )
} 