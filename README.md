<div align="center">

# FinSaathAI ⭐ - Secure AI meets loan management

</div>
Video Demo - https://youtu.be/Qm4lcF5KHeE
<br> 

![icon](https://github.com/user-attachments/assets/9c2b9e8e-0a47-4ca8-9a13-e46fe4936101)

FinSaathAI transforms the loan application process with secure facial verification technology. It lets you enjoy a streamlined multi-step loan application process while ensuring security and fraud prevention through advanced facial recognition.

> FinSaathAI combines advanced facial recognition technology with powerful loan management tools to transform the online banking experience.

## About Team FinSaathAI

FinSaathAI for Standard Hackathon. Our dedicated team members are Team8bYte.

## Why FinSaathAI? 
In today's era, where online banking and loan applications are becoming increasingly common, we saw an opportunity to bridge the gap between security and user convenience. Our mission is to revolutionize loan application processes by leveraging cutting-edge facial recognition technology to create a secure yet user-friendly experience that brings the best of both worlds together.

![UI](https://github.com/user-attachments/assets/69c34230-64f0-412d-aec5-7058df562b6e)

<br> 

## Key Features

- **Facial Recognition**: Uses face-api.js for secure identity verification
- **Multi-step Loan Application**: Guides users through the loan application process
- **Secure Identity Verification**: Prevents fraud in online loan applications
- **Responsive Design**: Works on desktop and mobile devices
- **Persistence**: Stores facial data and application progress in localStorage
- **Video Guidance System**: Interactive video-based learning experience

## Architecture Flow 

<img src="https://github.com/user-attachments/assets/5f2b0fba-f674-4572-bafc-ce20dd7e4f77" width="400">

&nbsp;  

| **Category**           | **Technologies**                                      |
|------------------------|------------------------------------------------------|
| **Frontend**          | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui         |
| **Backend & Deployment** | Node.js, FFmpeg, Web Audio API     |
| **AI & Media Processing** | face-api.js, react-webcam, OpenAI Whisper |  


## FinSaathAI Documentation

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Facial Verification System](#facial-verification-system)
- [Video Guidance System](#video-guidance-system)
- [Troubleshooting](#troubleshooting)

---

> [!WARNING]  
> You need HTTPS setup for reliable camera access to be able to run the application. 

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- For HTTPS: mkcert (recommended for camera access)
- FFmpeg for audio processing
- OpenAI Whisper for speech-to-text conversion

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

---

## Facial Verification System

This application uses face-api.js, a JavaScript API for face detection and recognition in the browser. The system:

1. **Captures** the user's face via webcam
2. **Extracts** facial features to create a unique descriptor
3. **Stores** the descriptor for new applicants (in localStorage)
4. **Verifies** returning applicants against their stored descriptor

### User Flow

1. User enables their camera
2. For new applications:
   - User clicks "New Application"
   - System captures and analyzes their face
   - A unique face ID is generated and associated with the loan application
   - User data is stored in localStorage for persistence
3. For returning applicants:
   - User clicks "Continue Application"
   - System matches their face against stored descriptors
   - If verified, they can continue their loan application
   - A match confidence score is displayed to the user

## Video Guidance System

This system provides an interactive video-based learning experience with voice-recorded responses and AI feedback.

### Features

- Sequential video playback with questions
- Voice recording for answers
- Automatic speech-to-text conversion
- AI-powered feedback on responses
- Progress tracking across segments
- Manual text editing capability

### Usage

1. Navigate to the manager dashboard
2. Watch each video segment
3. Record your answers using the microphone button
4. Edit transcribed text if needed
5. Get AI feedback on your responses
6. Progress through all segments and questions

## Troubleshooting

If you encounter any issues:

- Ensure you're using HTTPS for reliable camera access
- Check browser permissions for camera access
- Position your face properly in good lighting
- Try using Chrome or Firefox if you experience issues
- Check the browser console for any specific error messages

## Team

Developed by Team8bYte for the Standard Hackathon

## License

This project is MIT licensed.
