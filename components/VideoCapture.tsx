"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Video, VideoOff, AlertTriangle } from "lucide-react"

export default function VideoCapture({ 
  onVideoStateChange 
}: { 
  onVideoStateChange: (isActive: boolean) => void 
}) {
  const [videoActive, setVideoActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check camera permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (!navigator.permissions) {
          console.log("Permissions API not supported");
          return;
        }

        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(result.state);

        result.onchange = () => {
          setPermissionState(result.state);
          
          if (result.state === 'granted' && !videoActive) {
            // Auto-start video if permission is granted
            toggleVideo();
          } else if (result.state === 'denied' && videoActive) {
            // Stop video if permission is denied
            stopVideo();
          }
        };
      } catch (error) {
        console.error("Error checking camera permissions:", error);
      }
    };

    checkPermissions();
  }, [videoActive]);

  // Cleanup function for video stream
  useEffect(() => {
    return () => {
      stopVideo();
    }
  }, []);

  // Stop video
  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null;
    }
    
    if (videoActive) {
      setVideoActive(false);
      onVideoStateChange(false);
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (videoActive) {
      stopVideo();
    } else {
      // Start video
      try {
        setErrorMessage(null);
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Your browser doesn't support camera access. Please try a different browser.")
        }
        
        console.log("Requesting camera access...");
        
        // Request access with specific constraints for better face detection
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user", // Front camera
            frameRate: { ideal: 24 } // Smoother video
          },
          audio: false,
        });

        console.log("Camera access granted");
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Make sure video is playing
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(e => {
                console.error("Error playing video:", e);
              });
            }
          };
        }

        setVideoActive(true);
        onVideoStateChange(true);
      } catch (error: any) {
        console.error("Error accessing camera:", error);
        
        // Provide more specific error messages
        if (error.name === 'NotAllowedError') {
          setErrorMessage("Camera access denied. Please allow camera access in your browser settings.");
        } else if (error.name === 'NotFoundError') {
          setErrorMessage("No camera found. Please ensure your camera is properly connected.");
        } else if (error.name === 'NotReadableError') {
          setErrorMessage("Camera is in use by another application. Please close other applications using your camera.");
        } else {
          setErrorMessage(error.message || "Error accessing camera. Please check your browser permissions.");
        }
        
        onVideoStateChange(false);
      }
    }
  };

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Loan Application Identity Verification</h3>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVideo}
            className={videoActive ? "bg-red-100 hover:bg-red-200" : ""}
          >
            {videoActive ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="p-6 flex-1 flex items-center justify-center bg-muted/30 rounded-lg relative">
        {videoActive ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover rounded-lg" 
          />
        ) : (
          <div className="text-center text-muted-foreground">
            {errorMessage ? (
              <div className="text-red-500 mb-2">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{errorMessage}</p>
              </div>
            ) : (
              <>
                <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Click the camera icon to start verification</p>
                <p className="text-xs mt-2">Your camera is required for the loan application process</p>
              </>
            )}
          </div>
        )}
        
        {videoActive && (
          <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Camera active
          </div>
        )}
      </div>
      
      {/* Permissions indicator */}
      {permissionState && (
        <div className="px-6 py-2 text-xs">
          <div className="flex items-center">
            <span className="mr-2">Camera permission:</span>
            <span 
              className={`rounded-full w-2 h-2 ${
                permissionState === 'granted' ? 'bg-green-500' : 
                permissionState === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            />
            <span className="ml-2 capitalize">{permissionState}</span>
          </div>
        </div>
      )}
    </div>
  )
} 