# Loan Manager

## Facial Verification for Bank Loan Applications

A secure application for verifying user identity during the loan application process using facial recognition.

![Application Screenshot](screenshot.png)

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
