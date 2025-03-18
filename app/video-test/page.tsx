"use client"

export default function VideoTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Video Test Page</h1>
      <div className="space-y-8">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div key={num} className="space-y-2">
            <h2 className="text-lg font-semibold">Video {num}</h2>
            <video 
              controls 
              className="w-full max-w-2xl"
              preload="metadata"
            >
              <source src={`/videos/segments/v${num}.mp4`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-gray-600">Path: /videos/segments/v{num}.mp4</p>
          </div>
        ))}
      </div>
    </div>
  )
} 