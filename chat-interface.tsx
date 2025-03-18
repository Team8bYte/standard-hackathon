"use client"

import { useState } from "react"
import VideoCapture from "@/components/VideoCapture"
import FaceVerification from "@/components/FaceVerification"

export default function VideoVerificationInterface() {
  const [videoActive, setVideoActive] = useState(false)

  const handleVideoStateChange = (isActive: boolean) => {
    setVideoActive(isActive)
  }

  return (
    <div className="flex-1 p-4 flex flex-col">
      <div className="grid md:grid-cols-2 gap-4 flex-1">
        {/* Video Feed */}
        <VideoCapture onVideoStateChange={handleVideoStateChange} />
        
        {/* Facial Verification */}
        <FaceVerification videoActive={videoActive} />
      </div>
    </div>
  )
}

