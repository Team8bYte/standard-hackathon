"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, User, RefreshCcw, Camera, AlertTriangle } from "lucide-react"
import Webcam from "react-webcam"
import * as facialVerification from "@/lib/facial-verification"

export default function FaceVerification({ videoActive }: { videoActive: boolean }) {
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)
  const webcamRef = useRef<Webcam>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [hasEnrolledFaces, setHasEnrolledFaces] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Periodically check if there are enrolled faces
  useEffect(() => {
    if (isInitialized) {
      const enrolledCount = facialVerification.getStoredFacesCount();
      setHasEnrolledFaces(enrolledCount > 0);
      console.log(`Found ${enrolledCount} enrolled faces`);
    }
  }, [isInitialized, verificationStatus]);

  // Initialize face-api.js
  useEffect(() => {
    const initializeFaceApi = async () => {
      try {
        setIsInitializing(true);
        setInitializationError(null);
        console.log("Initializing face-api.js...");
        
        const initialized = await facialVerification.initFaceApi();
        if (initialized) {
          setIsInitialized(true);
          setIsInitializing(false);
          console.log("Face API initialized successfully");
          
          // Check if there are enrolled faces
          const enrolledCount = facialVerification.getStoredFacesCount();
          setHasEnrolledFaces(enrolledCount > 0);
          console.log(`Found ${enrolledCount} enrolled faces`);
          
          // List enrolled faces for debugging
          console.log("Enrolled faces:", facialVerification.listStoredFaces());
        } else {
          setInitializationError("Error initializing facial verification. Please check console for details.");
          setIsInitializing(false);
        }
      } catch (error) {
        console.error("Error initializing facial verification:", error);
        setInitializationError("Error initializing facial verification. Please try again later.");
        setIsInitializing(false);
      }
    };

    initializeFaceApi();
  }, [retryCount]);

  // Retry initialization
  const retryInitialization = () => {
    setRetryCount(prev => prev + 1);
  };

  // Capture image from video with enhanced quality
  const captureImage = (): HTMLImageElement | null => {
    try {
      if (!webcamRef.current) {
        console.error("Webcam reference not available");
        return null;
      }

      if (!webcamRef.current.video) {
        console.error("Video element not available");
        return null;
      }
      
      // Ensure video is playing and has valid dimensions
      const video = webcamRef.current.video;
      if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
        console.error("Video not ready or has invalid dimensions", {
          readyState: video.readyState,
          width: video.videoWidth,
          height: video.videoHeight
        });
        return null;
      }
      
      console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
      
      // Use canvas for higher quality image capture
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error("Could not get canvas context");
        return null;
      }
      
      // Improve image quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get data URL from canvas
      const imageSrc = canvas.toDataURL('image/jpeg', 1.0); // Use maximum quality
      if (!imageSrc) {
        console.error("Failed to capture image from canvas");
        return null;
      }
      
      console.log("Image captured with dimensions:", canvas.width, "x", canvas.height);
      
      // Save captured image for display
      setCapturedImage(imageSrc);
      
      // Create an image element from the data URL
      const img = new Image();
      img.src = imageSrc;
      img.width = canvas.width;
      img.height = canvas.height;
      
      // Return the image element
      return img;
    } catch (error) {
      console.error('Error capturing image:', error);
      return null;
    }
  };
  
  // Process captured image for enrollment with enhanced detection
  const processImageForEnrollment = async (image: HTMLImageElement): Promise<string | null> => {
    if (!image) return null;
    
    try {
      // Wait for image to load completely
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.onload = () => resolve();
        });
      }
      
      // Log image information for debugging
      console.log("Processing image for enrollment:", {
        width: image.width,
        height: image.height,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      });
      
      // Wait a bit longer to ensure the image is fully processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Extract face descriptor
      console.log("Extracting face descriptor for enrollment...");
      
      // Trying multiple times with different detection parameters
      let descriptor = await facialVerification.extractFaceDescriptor(image);
      
      // If first attempt fails, try with different parameters
      if (!descriptor) {
        console.log("First face detection attempt failed, trying again with different parameters...");
        
        // Wait a moment and try again
        await new Promise(resolve => setTimeout(resolve, 200));
        descriptor = await facialVerification.extractFaceDescriptorWithOptions(image, {
          minConfidence: 0.4, // Lower confidence threshold
          enlargeFactor: 0.2 // Enlarge detection area
        });
      }
      
      // If still no face detected, give up
      if (!descriptor) {
        throw new Error('No face detected. Please ensure your face is clearly visible and centered in the camera view. Try adjusting your lighting or position.');
      }
      
      // Create user data (for a bank loan application)
      const userData = {
        email: "applicant@example.com",
        applicantId: `applicant-${Date.now()}`,
        loanApplicationId: `loan-${Date.now()}`,
        applicationStep: "initial", 
        timestamp: new Date().toISOString()
      };
      
      // Enroll face
      console.log("Enrolling face...");
      const faceId = facialVerification.enrollFace(descriptor, userData);
      
      // Update our enrollment status
      setHasEnrolledFaces(true);
      
      return faceId;
    } catch (error) {
      console.error('Error processing image for enrollment:', error);
      throw error;
    }
  };
  
  // Process captured image for authentication with enhanced detection
  const processImageForAuthentication = async (image: HTMLImageElement) => {
    if (!image) return null;
    
    try {
      // Wait for image to load completely
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          image.onload = () => resolve();
        });
      }
      
      // Log image information for debugging
      console.log("Processing image for authentication:", {
        width: image.width,
        height: image.height,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      });
      
      // Wait a bit longer to ensure the image is fully processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Extract face descriptor
      console.log("Extracting face descriptor for authentication...");
      
      // Trying multiple times with different detection parameters
      let descriptor = await facialVerification.extractFaceDescriptor(image);
      
      // If first attempt fails, try with different parameters
      if (!descriptor) {
        console.log("First face detection attempt failed, trying again with different parameters...");
        
        // Wait a moment and try again
        await new Promise(resolve => setTimeout(resolve, 200));
        descriptor = await facialVerification.extractFaceDescriptorWithOptions(image, {
          minConfidence: 0.4, // Lower confidence threshold
          enlargeFactor: 0.2 // Enlarge detection area
        });
      }
      
      if (!descriptor) {
        throw new Error('Face not recognized. Please try again or click "New Application" to register.');
      }
      
      // Find matching face
      console.log("Finding matching face...");
      const matchResult = await facialVerification.findMatchingFace(descriptor);
      return matchResult;
    } catch (error) {
      console.error('Error processing image for authentication:', error);
      throw error;
    }
  };

  // Enroll face
  const enrollFace = async () => {
    if (!isInitialized) {
      setVerificationStatus("Facial verification not initialized. Please refresh the page.");
      return;
    }

    if (!videoActive) {
      setVerificationStatus("Please enable your camera first.");
      return;
    }

    try {
      setIsProcessing(true);
      setVerificationStatus("Starting enrollment...");
      
      // Verify video is active and streaming
      if (!webcamRef.current?.video || !webcamRef.current.video.readyState) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Waiting for video to be ready...");
      }
      
      // Capture image
      const image = captureImage();
      if (!image) {
        throw new Error('Failed to capture image. Please check your camera and try again.');
      }
      
      setVerificationStatus("Processing image and detecting face...");
      
      // Process image for enrollment
      const faceId = await processImageForEnrollment(image);
      if (!faceId) {
        throw new Error('Enrollment failed. Please try again with better lighting and position your face in the center of the camera view.');
      }
      
      setVerificationStatus(`
        Enrollment successful!
        Face ID: ${faceId}
        This ID will be associated with your loan application.
        
        You can now click "Continue Application" when returning.
      `);
    } catch (error: any) {
      console.error("Enrollment error:", error);
      setVerificationStatus(`Enrollment failed: ${error.message || 'Please try again with better lighting'}`);
      
      // We don't need this anymore as it's handled in the facial-verification service
      // facialVerification.dispatchVerificationEvent('enroll', false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Authenticate face
  const authenticateFace = async () => {
    if (!isInitialized) {
      setVerificationStatus("Facial verification not initialized. Please refresh the page.");
      return;
    }

    if (!videoActive) {
      setVerificationStatus("Please enable your camera first.");
      return;
    }

    try {
      setIsProcessing(true);
      setVerificationStatus("Starting authentication...");
      
      // Get stored faces count
      const storedFacesCount = facialVerification.getStoredFacesCount();
      if (storedFacesCount === 0) {
        throw new Error('No faces enrolled yet. Please click "New Application" to register your face first.');
      }
      
      // Verify video is active and streaming
      if (!webcamRef.current?.video || !webcamRef.current.video.readyState) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Waiting for video to be ready...");
      }
      
      // Capture image
      const image = captureImage();
      if (!image) {
        throw new Error('Failed to capture image. Please check your camera and try again.');
      }
      
      setVerificationStatus("Processing image and verifying identity...");
      
      // Process image for authentication
      const matchResult = await processImageForAuthentication(image);
      if (!matchResult) {
        throw new Error('Face not recognized. Please try again or click "New Application" to register.');
      }
      
      if (matchResult.score < 0.35) {
        throw new Error(`Face verification failed. Please ensure good lighting and look directly at the camera, or click "New Application" if you haven't registered before.`);
      }
      
      setVerificationStatus(`
        Authentication successful! 
        Welcome back, Applicant ID: ${matchResult.userData.applicantId}
        Loan Application: ${matchResult.userData.loanApplicationId}
        Match confidence: ${(matchResult.score * 100).toFixed(1)}%
        
        You can now proceed with your loan application.
      `);
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Provide a clearer message for unregistered users
      if (error.message && error.message.includes("No faces enrolled")) {
        setVerificationStatus(`You haven't registered yet!

Please click "New Application" to register your face before continuing.`);
        
        // Display a clearer UI message with an icon
        const verificationDiv = document.querySelector('[data-verification-status]');
        if (verificationDiv) {
          verificationDiv.classList.add('bg-amber-50', 'border-amber-200');
        }
      } else {
        setVerificationStatus(`Authentication failed: ${error.message || 'Face not recognized'}`);
      }
      
      // We don't need this anymore as it's handled in the facial-verification service
      // facialVerification.dispatchVerificationEvent('authenticate', false);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Clear all enrolled faces (for debugging/testing)
  const clearAllFaces = () => {
    facialVerification.clearStoredFaces();
    setHasEnrolledFaces(false);
    setVerificationStatus("All enrolled faces have been cleared.");
    
    // We don't need this anymore as it's handled in the facial-verification service
    // facialVerification.dispatchVerificationEvent('clear', true);
  };

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden h-full">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Facial Verification</h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Verify your identity to continue with your loan application.
          </p>

          {isInitializing && (
            <div className="p-4 border rounded-lg bg-blue-50 mt-2">
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-blue-600">Initializing facial verification system...</p>
              </div>
            </div>
          )}

          {initializationError && !isInitializing && (
            <div className="p-4 border rounded-lg bg-red-50 mt-2">
              <p className="text-red-600">{initializationError}</p>
              <p className="text-sm mt-2">
                Please refresh the page or try a different browser.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 text-xs flex items-center" 
                onClick={retryInitialization}
              >
                <RefreshCcw className="h-3 w-3 mr-1" /> Retry Initialization
              </Button>
            </div>
          )}

          {verificationStatus && !initializationError && !isInitializing && (
            <div className="p-4 border rounded-lg bg-muted/50 mt-2 whitespace-pre-line" data-verification-status>
              <p>{verificationStatus}</p>
              
              {/* Add action button if verification failed due to no enrollment */}
              {verificationStatus.includes("You haven't registered yet") && (
                <Button 
                  onClick={enrollFace}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white flex items-center"
                  disabled={isProcessing}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Now
                </Button>
              )}
            </div>
          )}
          
          {!videoActive && isInitialized && !isInitializing && !verificationStatus && (
            <div className="p-4 border rounded-lg bg-amber-50 mt-2">
              <div className="flex items-center text-amber-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p>Please enable your camera to use facial verification.</p>
              </div>
            </div>
          )}
          
          {videoActive && !isInitializing && !isProcessing && (
            <div className="mt-4 p-4 border rounded-lg bg-green-50">
              <div className="flex items-center">
                <Camera className="h-5 w-5 mr-2 text-green-600" />
                <p className="text-green-600">Camera is active and ready</p>
              </div>
              <p className="text-xs text-green-700 mt-2">For best results:</p>
              <ul className="text-xs text-green-700 mt-1 list-disc ml-5">
                <li>Ensure good lighting on your face</li>
                <li>Look directly at the camera</li>
                <li>Remove glasses or face coverings</li>
                <li>Center your face in the frame</li>
              </ul>
            </div>
          )}
          
          {/* Webcam component */}
          <div className={videoActive ? "block" : "hidden"}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
              }}
              className={isProcessing ? "hidden" : "w-full h-auto rounded-lg border mt-4"}
              screenshotQuality={1}
              imageSmoothing={true}
              minScreenshotWidth={640}
              minScreenshotHeight={480}
              forceScreenshotSourceSize={true}
            />
          </div>
          
          {/* Canvas for image processing - hidden */}
          <canvas ref={canvasRef} className="hidden" width="640" height="480" />
          
          {/* Display captured image */}
          {capturedImage && !isInitializing && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Captured Image:</p>
              <div className="relative">
                <img 
                  src={capturedImage} 
                  alt="Captured face" 
                  className="w-64 h-auto object-cover rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-muted-foreground/10"
                  onClick={() => setCapturedImage(null)}
                >
                  <RefreshCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Button 
            onClick={enrollFace} 
            disabled={!videoActive || isProcessing || !isInitialized || isInitializing} 
            className="flex items-center justify-center gap-2 py-3 h-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span>New Application</span>
          </Button>

          <Button 
            onClick={authenticateFace} 
            disabled={!videoActive || isProcessing || !isInitialized || isInitializing || !hasEnrolledFaces} 
            variant="secondary" 
            className="flex items-center justify-center gap-2 py-3 h-auto"
            title={!hasEnrolledFaces ? "You must create a new application first" : ""}
          >
            <User className="h-4 w-4" />
            <span>Continue Application</span>
          </Button>
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>First-time users</span>
          <span>Returning users</span>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-2 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllFaces}
              className="text-xs"
            >
              Clear All Enrollments (Debug)
            </Button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium mb-2">Verification Process</h3>
          <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
            <li>Enable your camera by clicking the camera icon</li>
            <li><strong>New applicants:</strong> Click "New Application" to register</li>
            <li><strong>Returning applicants:</strong> Click "Continue Application" to verify</li>
            <li>Once verified, you can proceed with your loan application</li>
          </ol>
          
          {/* Add additional guidance */}
          <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            <p className="font-medium">Important Note:</p> 
            <p>If you haven't registered yet, you must click "New Application" first. The "Continue Application" button is only for returning users.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 