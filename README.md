# Loan Manager

## Facial Verification for Bank Loan Applications

A secure application for verifying user identity during the loan application process using facial recognition.

![icon](https://github.com/user-attachments/assets/9c2b9e8e-0a47-4ca8-9a13-e46fe4936101)



## Features

-  **Facial Recognition**: Uses face-api.js for secure identity verification
-  **Multi-step Loan Application**: Guides users through the loan application process
-  **Secure Identity Verification**: Prevents fraud in online loan applications
-  **Responsive Design**: Works on desktop and mobile devices
-  **Persistence**: Stores facial data and application progress in localStorage

## Technologies Used

-  Next.js 15
-  React 19
-  TypeScript
-  Tailwind CSS
-  face-api.js (for facial recognition)
-  react-webcam (for camera access)
-  shadcn/ui (for UI components)

## Getting Started

### Prerequisites

-  Node.js 18.17 or later
-  npm or yarn
-  For HTTPS: mkcert (recommended for camera access)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Team8bYte/standard-hackathon.git
cd standard-hackathon
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Download the required face-api.js models:

```bash
npm run setup-models
```

4. Set up HTTPS for local development (recommended for camera access):

```bash
npm run setup-https
```

5. Start the development server with HTTPS:

```bash
npm run dev:https
```

6. Open [https://localhost:3000](https://localhost:3000) in your browser.

## Facial Verification System

This application uses face-api.js, a JavaScript API for face detection and recognition in the browser. The system:

1. **Captures** the user's face via webcam
2. **Extracts** facial features to create a unique descriptor
3. **Stores** the descriptor for new applicants (in localStorage)
4. **Verifies** returning applicants against their stored descriptor

### User Flow

1. User enables their camera
2. For new applications:
   -  User clicks "New Application"
   -  System captures and analyzes their face
   -  A unique face ID is generated and associated with the loan application
   -  User data is stored in localStorage for persistence
3. For returning applicants:
   -  User clicks "Continue Application"
   -  System matches their face against stored descriptors
   -  If verified, they can continue their loan application
   -  A match confidence score is displayed to the user

## Troubleshooting

If you encounter any issues:

-  Ensure you're using HTTPS for reliable camera access
-  Check browser permissions for camera access
-  Position your face properly in good lighting
-  Try using Chrome or Firefox if you experience issues
-  Check the browser console for any specific error messages

## Team

Developed by Team8bYte for the Standard Hackathon

## License

This project is MIT licensed.

# Video Guidance System

This system provides an interactive video-based learning experience with voice-recorded responses and AI feedback.

## Prerequisites

1. FFmpeg for audio processing
2. OpenAI Whisper for speech-to-text conversion
3. Node.js and npm

## Installation

1. Install FFmpeg:

   ```bash
   # macOS (using Homebrew)
   brew install ffmpeg

   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   ```

2. Install Whisper:

   ```bash
   pip install openai-whisper
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

## Setup

1. Place your video segments in the following directory structure:

   ```
   public/videos/segments/video1/
   ├── segment_1.mp4
   ├── segment_2.mp4
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Features

-  Sequential video playback with questions
-  Voice recording for answers
-  Automatic speech-to-text conversion
-  AI-powered feedback on responses
-  Progress tracking across segments
-  Manual text editing capability

## Usage

1. Navigate to the manager dashboard
2. Watch each video segment
3. Record your answers using the microphone button
4. Edit transcribed text if needed
5. Get AI feedback on your responses
6. Progress through all segments and questions

## Technical Details

-  Uses the Web Audio API for voice recording
-  Implements OpenAI Whisper for speech recognition
-  Processes audio through a Next.js API route
-  Provides real-time video playback controls
