"use client";

import { useState, useEffect, useRef } from "react";
import FaceVerification from "@/components/FaceVerification";
import VideoCapture from "@/components/VideoCapture";
import FinancialInformation from "@/components/FinancialInformation";
import DocumentVerification from "@/components/DocumentVerification";
import SubmitApplication from "@/components/SubmitApplication";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileCheck,
  CreditCard,
  FileText,
  AlertTriangle,
  UserPlus,
  User,
  Files,
} from "lucide-react";
import * as facialVerification from "@/lib/facial-verification";
import { clearCurrentUserData, logoutUser } from "@/lib/user-data";

export default function VideoVerificationInterface() {
  const [videoActive, setVideoActive] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasEnrolledFaces, setHasEnrolledFaces] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [initStatus, setInitStatus] = useState<string>("initializing");

  const webcamRef = useRef<Webcam>(null);
  const [clickedStepId, setClickedStepId] = useState<number | null>(null);
  const [animatingSection, setAnimatingSection] = useState<number | null>(null);

  // Store refs to step elements for scroll into view functionality
  const stepRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

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
          const savedUserData = localStorage.getItem("currentUserData");
          if (savedUserData) {
            try {
              const parsedUserData = JSON.parse(savedUserData);
              setUserData(parsedUserData);
              setUserAuthenticated(true);
              setVerificationComplete(true);
              console.log("User already authenticated:", parsedUserData);
            } catch (e) {
              console.error("Error parsing saved user data:", e);
              localStorage.removeItem("currentUserData");
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

        // Clear any previous user's data before storing new user data
        clearCurrentUserData();

        localStorage.setItem("currentUserData", JSON.stringify(userData));
        console.log("User enrolled successfully:", userData);
      } else if (action === "authenticate" && success) {
        // User has authenticated with an existing face
        setUserData(userData);
        setUserAuthenticated(true);
        setVerificationComplete(true);

        // Check if it's a different user than the last one
        const currentStoredUser = localStorage.getItem("currentUserData");
        if (currentStoredUser) {
          const parsedUser = JSON.parse(currentStoredUser);
          if (parsedUser.applicantId !== userData.applicantId) {
            // Different user logging in, clear previous user's data
            clearCurrentUserData();
          }
        }

        localStorage.setItem("currentUserData", JSON.stringify(userData));
        console.log("User authenticated successfully:", userData);
      } else if (action === "clear") {
        // All faces have been cleared
        setHasEnrolledFaces(false);
        setUserAuthenticated(false);
        setVerificationComplete(false);
        setUserData(null);
        logoutUser(); // Use the utility function for complete logout
        console.log("All faces cleared");
      }
    };

    // Add custom event listener
    window.addEventListener(
      "faceVerificationEvent",
      handleVerificationEvent as EventListener
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        "faceVerificationEvent",
        handleVerificationEvent as EventListener
      );
    };
  }, []);

  // Handle step completion
  const handleStepComplete = () => {
    if (currentStep < applicationSteps.length) {
      const nextStep = currentStep + 1;

      // Add animation effect when advancing to next step
      setAnimatingSection(nextStep);
      setTimeout(() => {
        setAnimatingSection(null);
      }, 500);

      setCurrentStep(nextStep);

      // Scroll to the next section
      setTimeout(() => {
        const sectionElement = document.getElementById(
          `step-section-${nextStep}`
        );
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  // Navigate to specific step
  const navigateToStep = (stepId: number) => {
    // Only allow navigation to completed steps or the current step
    if (verificationComplete && stepId <= currentStep) {
      // Set the clicked step for animation feedback
      setClickedStepId(stepId);

      // Clear the animation after a short delay
      setTimeout(() => {
        setClickedStepId(null);
      }, 300);

      // Set the animating section for fade-in effect
      setAnimatingSection(stepId);
      setTimeout(() => {
        setAnimatingSection(null);
      }, 500);

      // Navigate to the step
      setCurrentStep(stepId);

      // Scroll the corresponding section into view smoothly
      const sectionElement = document.getElementById(`step-section-${stepId}`);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Next step in application process
  const goToNextStep = () => {
    if (currentStep < applicationSteps.length) {
      const nextStep = currentStep + 1;

      // Add animation effect when advancing to next step
      setAnimatingSection(nextStep);
      setTimeout(() => {
        setAnimatingSection(null);
      }, 500);

      setCurrentStep(nextStep);

      // Scroll to the next section
      setTimeout(() => {
        const sectionElement = document.getElementById(
          `step-section-${nextStep}`
        );
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  // Log out (clear current user)
  const logOut = () => {
    setUserAuthenticated(false);
    setVerificationComplete(false);
    setUserData(null);
    setHasEnrolledFaces(false);
    setCurrentStep(1);
    logoutUser(); // Use the utility function for complete logout
  };

  // Steps of the loan application process
  const applicationSteps = [
    { id: 1, name: "Identity Verification", icon: FileCheck },
    {
      id: 2,
      name: "Financial Information",
      icon: CreditCard,
      disabled: !verificationComplete,
    },
    {
      id: 3,
      name: "Document Verification",
      icon: Files,
      disabled: !verificationComplete,
    },
    {
      id: 4,
      name: "Submit Application",
      icon: FileText,
      disabled: !verificationComplete,
    },
  ];

  // Helper function for section animation classes
  const getSectionAnimationClass = (stepId: number) => {
    if (animatingSection === stepId) {
      return "opacity-0 transform translate-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300";
    }
    return "";
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Secure Bank Loan Application</h1>

        {userAuthenticated && userData && (
          <div className="flex items-center">
            <div className="text-right mr-4">
              <p className="font-medium">{userData.applicantId}</p>
              <p className="text-sm text-muted-foreground">
                Application ID: {userData.loanApplicationId}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={logOut}>
              Log Out
            </Button>
          </div>
        )}
      </div>

      {/* Application steps */}
      <div className="mb-8">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            {applicationSteps.map((step, index) => {
              const isClickable =
                verificationComplete && step.id <= currentStep;
              const isClicked = clickedStepId === step.id;
              const isCurrentStep = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center ${
                    isClickable ? "group" : ""
                  } relative`}
                  onClick={() => navigateToStep(step.id)}
                  style={{ cursor: isClickable ? "pointer" : "default" }}
                  title={
                    isClickable
                      ? `Go to ${step.name}`
                      : step.disabled
                      ? "Complete previous steps first"
                      : ""
                  }
                  ref={(el) => {
                    if (el) stepRefs.current[step.id] = el;
                  }}
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                      isCurrentStep
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : currentStep > step.id
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    } ${
                      isClickable && !isCurrentStep
                        ? "group-hover:ring-2 group-hover:ring-primary/50 group-hover:shadow-md"
                        : ""
                    }
                    ${isClicked ? "scale-90 opacity-80" : ""}`}
                  >
                    <step.icon
                      className={`w-6 h-6 ${
                        isClickable
                          ? "group-hover:scale-110 transition-transform duration-200"
                          : ""
                      }`}
                    />

                    {/* Click indicator for accessible steps */}
                    {isClickable && !isCurrentStep && (
                      <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-primary/90 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                        Click to navigate
                      </span>
                    )}
                  </div>
                  <span
                    className={`ml-3 text-sm transition-colors duration-200 ${
                      step.disabled ? "text-muted-foreground" : "font-medium"
                    } ${isClickable ? "group-hover:text-primary" : ""}`}
                  >
                    {step.name}
                  </span>
                  {index < applicationSteps.length - 1 && (
                    <div
                      className={`w-24 h-1 mx-4 transition-colors duration-200 ${
                        currentStep > step.id ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Helper text for navigation */}
          {verificationComplete && (
            <div className="text-xs text-muted-foreground text-center animate-pulse">
              Click on any completed step to navigate back to it
            </div>
          )}
        </div>
      </div>

      {/* Show verification interface only if not yet authenticated */}
      {!userAuthenticated ? (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${getSectionAnimationClass(
            1
          )}`}
          id="step-section-1"
        >
          <div className="order-1 md:order-1">
            <FaceVerification videoActive={videoActive} webcamRef={webcamRef} />
          </div>
          <div className="order-2 md:order-2">
            <VideoCapture
              onVideoStateChange={handleVideoStateChange}
              webcamRef={webcamRef}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Identity Verification Complete Message */}
          <div
            className={`p-6 border rounded-lg bg-green-50 mb-6 ${getSectionAnimationClass(
              1
            )}`}
            id="step-section-1"
          >
            <div className="flex items-start">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <FileCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-green-800">
                  Identity Verification Complete
                </h2>
                <p className="text-green-700 mt-1">
                  Your identity has been verified. You can now proceed with your
                  loan application.
                </p>
                {userData && (
                  <div className="mt-2 p-3 bg-white rounded-md text-sm">
                    <p>
                      <strong>Applicant ID:</strong> {userData.applicantId}
                    </p>
                    <p>
                      <strong>Application ID:</strong>{" "}
                      {userData.loanApplicationId}
                    </p>
                    <p>
                      <strong>Started:</strong>{" "}
                      {new Date(userData.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information Step */}
          {currentStep === 2 && (
            <div
              className={`mt-8 ${getSectionAnimationClass(2)}`}
              id="step-section-2"
            >
              <FinancialInformation onComplete={handleStepComplete} />
            </div>
          )}

          {/* Document Verification Step */}
          {currentStep === 3 && (
            <div
              className={`mt-8 ${getSectionAnimationClass(3)}`}
              id="step-section-3"
            >
              <DocumentVerification onComplete={handleStepComplete} />
            </div>
          )}

          {/* Submit Application Step */}
          {currentStep === 4 && (
            <div
              className={`mt-8 ${getSectionAnimationClass(4)}`}
              id="step-section-4"
            >
              <SubmitApplication />
            </div>
          )}
        </>
      )}

      <div className="mt-8 flex justify-between items-center">
        <div>
          {!verificationComplete ? (
            <p className="text-muted-foreground">
              Please complete identity verification to continue your loan
              application.
            </p>
          ) : (
            <p className="text-green-600 flex items-center">
              <FileCheck className="mr-2 h-5 w-5" />
              Identity verification successful! You can now proceed with your
              application.
            </p>
          )}
        </div>

        <div className="flex space-x-4">
          {!userAuthenticated && hasEnrolledFaces && (
            <Button
              variant="outline"
              onClick={() => {
                // Trigger the event manually (in real app, this would come from FaceVerification)
                const event = new CustomEvent("faceVerificationEvent", {
                  detail: {
                    action: "authenticate",
                    success: true,
                    userData: {
                      applicantId: `applicant-${Date.now()}`,
                      loanApplicationId: `loan-${Date.now()}`,
                      email: "applicant@example.com",
                      timestamp: new Date().toISOString(),
                    },
                  },
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
                const event = new CustomEvent("faceVerificationEvent", {
                  detail: {
                    action: "enroll",
                    success: true,
                    userData: {
                      applicantId: `applicant-${Date.now()}`,
                      loanApplicationId: `loan-${Date.now()}`,
                      email: "applicant@example.com",
                      timestamp: new Date().toISOString(),
                    },
                  },
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
            disabled={
              !verificationComplete || currentStep >= applicationSteps.length
            }
            className="flex items-center"
          >
            Continue Application <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
