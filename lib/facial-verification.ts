import * as faceapi from "face-api.js";

// Types for our facial verification system
export type UserData = {
  email: string;
  applicantId: string;
  loanApplicationId: string;
  applicationStep: string;
  timestamp: string;
  [key: string]: any; // Allow additional properties
};

type StoredFace = {
  id: string;
  descriptor: Float32Array;
  userData: UserData;
  createdAt: string;
};

// Modified to match what we're using in the findMatchingFace function
export type MatchResult = {
  id: string;
  faceId?: string; // For compatibility with both naming approaches
  score: number;
  userData: UserData;
  matched?: boolean; // Whether the match meets the threshold
};

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Use localStorage for persistent storage within the browser session
function getStoredFaces(): StoredFace[] {
  if (!isBrowser) return [];

  try {
    const facesJson = localStorage.getItem("storedFaces");
    if (facesJson) {
      const parsedFaces = JSON.parse(facesJson);
      // Convert stored array descriptors back to Float32Array
      return parsedFaces.map((face: any) => ({
        ...face,
        descriptor: new Float32Array(face.descriptor),
      }));
    }
  } catch (error) {
    console.error("Error retrieving stored faces from localStorage:", error);
  }
  return [];
}

function saveStoredFaces(faces: StoredFace[]): void {
  if (!isBrowser) return;

  try {
    // Convert Float32Array to regular array for storage
    const facesToStore = faces.map((face) => ({
      ...face,
      descriptor: face.descriptor ? Array.from(face.descriptor) : [],
    }));
    localStorage.setItem("storedFaces", JSON.stringify(facesToStore));
  } catch (error) {
    console.error("Error saving faces to localStorage:", error);
  }
}

// Helper function to generate a unique face ID
function generateFaceId(): string {
  return `face-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Calculate similarity between two face descriptors asynchronously
async function calculateSimilarity(
  descriptor1: Float32Array,
  descriptor2: Float32Array,
): Promise<number> {
  try {
    // Use Euclidean distance to calculate similarity
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);

    // Convert distance to a similarity score (0-1)
    const score = Math.max(0, 1 - distance);

    return score;
  } catch (error) {
    console.error("Error calculating similarity:", error);
    return 0;
  }
}

// In-memory storage of faces as a cached version of localStorage
let storedFaces: StoredFace[] = getStoredFaces();

// Track the initialization status
let isInitialized = false;

// Initialize face-api.js
export async function initFaceApi(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    console.log("Loading face-api.js models...");

    // Use loadFromUri which is more reliable in Next.js
    const MODEL_URL = "/models";

    // Attempt to load SSD MobileNet model first
    console.log("Loading SSD MobileNet model...");
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    console.log("SSD MobileNet model loaded successfully");

    // Then load the face landmark model
    console.log("Loading Face Landmark model...");
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    console.log("Face Landmark model loaded successfully");

    // Finally load the face recognition model
    console.log("Loading Face Recognition model...");
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log("Face Recognition model loaded successfully");

    isInitialized = true;
    console.log("All face-api.js models loaded successfully");

    // Load stored faces from localStorage
    storedFaces = getStoredFaces();
    console.log(`Loaded ${storedFaces.length} faces from storage`);

    return true;
  } catch (error) {
    console.error("Error loading face-api.js models:", error);
    isInitialized = false;
    return false;
  }
}

// Check if the model is initialized
export function isModelInitialized(): boolean {
  return isInitialized;
}

// Extract face descriptor from an image
export async function extractFaceDescriptor(
  imageElement: HTMLImageElement,
): Promise<Float32Array | null> {
  if (!isInitialized) {
    console.error("Face API models not initialized. Call initFaceApi() first.");
    return null;
  }

  try {
    // Make sure the image is fully loaded
    if (!imageElement.complete) {
      await new Promise((resolve) => {
        imageElement.onload = resolve;
      });
    }

    // Add a small delay to ensure the image is processed properly
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(
      "Detecting face...",
      "Image dimensions:",
      imageElement.width,
      "x",
      imageElement.height,
    );

    if (imageElement.width === 0 || imageElement.height === 0) {
      console.error("Image has invalid dimensions (0x0)");
      return null;
    }

    try {
      // Create a canvas element and draw the image to it for better processing
      const canvas = document.createElement("canvas");
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get canvas context");
        return null;
      }

      // Draw the image to the canvas
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

      // Try to detect and compute everything in one step
      const fullFaceDescription = await faceapi
        .detectSingleFace(canvas)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!fullFaceDescription) {
        console.log("No face detected in the image");
        return null;
      }

      console.log("Face descriptor successfully computed");
      return fullFaceDescription.descriptor;
    } catch (innerError) {
      console.error("Error in face detection pipeline:", innerError);
      return null;
    }
  } catch (error) {
    console.error("Error extracting face descriptor:", error);
    return null;
  }
}

// Calculate similarity score between two face descriptors
export function calculateMatchScore(
  descriptor1: Float32Array,
  descriptor2: Float32Array,
): number {
  if (!descriptor1 || !descriptor2) {
    console.error("Invalid descriptors provided for score calculation");
    return 0;
  }

  try {
    // Use Euclidean distance to calculate similarity
    // Lower distance means higher similarity
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);

    // Convert distance to a similarity score between 0 and 1
    // A score of 1 means identical, 0 means completely different
    // Distance is typically between 0 and 1.4, so we normalize it
    const score = Math.max(0, 1 - distance);

    return score;
  } catch (error) {
    console.error("Error calculating match score:", error);
    return 0;
  }
}

/**
 * Dispatch a facial verification event to the application
 *
 * @param action The action that occurred (enroll, authenticate, clear)
 * @param success Whether the action was successful
 * @param userData Any user data to include with the event
 */
export function dispatchVerificationEvent(
  action: string,
  success: boolean,
  userData: any = null,
): void {
  try {
    const event = new CustomEvent("faceVerificationEvent", {
      detail: {
        action,
        success,
        userData,
      },
    });

    window.dispatchEvent(event);
    console.log(`Dispatched ${action} verification event:`, {
      success,
      userData,
    });
  } catch (error) {
    console.error("Error dispatching verification event:", error);
  }
}

// Enroll a face with associated user data
export function enrollFace(
  descriptor: Float32Array,
  userData: UserData = {},
): string {
  try {
    // Generate a unique ID for this face
    const faceId = generateFaceId();

    // Add applicant and loan application IDs if not provided
    const timestamp = new Date().toISOString();
    const enhancedUserData = {
      ...userData,
      applicantId: userData.applicantId || `applicant-${Date.now()}`,
      loanApplicationId: userData.loanApplicationId || `loan-${Date.now()}`,
      timestamp,
    };

    // Store the face descriptor and user data
    const storedFace: StoredFace = {
      id: faceId,
      descriptor,
      userData: enhancedUserData,
      createdAt: timestamp,
    };

    // Add to stored faces
    const faces = getStoredFaces();
    faces.push(storedFace);
    saveStoredFaces(faces);

    // Update in-memory cache
    storedFaces = getStoredFaces();

    // Dispatch event for successful enrollment
    dispatchVerificationEvent("enroll", true, enhancedUserData);

    console.log("Face enrolled successfully with ID:", faceId);
    return faceId;
  } catch (error) {
    console.error("Error enrolling face:", error);

    // Dispatch event for failed enrollment
    dispatchVerificationEvent("enroll", false);

    throw error;
  }
}

// Find a matching face with a minimum threshold
export async function findMatchingFace(
  descriptor: Float32Array,
): Promise<MatchResult | null> {
  try {
    const storedFaces = getStoredFaces();

    if (storedFaces.length === 0) {
      console.log("No stored faces to compare against");
      return null;
    }

    let bestMatch: MatchResult | null = null;

    // Compare the face descriptor against all stored faces
    for (const storedFace of storedFaces) {
      // Calculate similarity score
      const score = await calculateSimilarity(
        descriptor,
        storedFace.descriptor,
      );

      // If better than current best match, update
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          id: storedFace.id,
          faceId: storedFace.id, // Add for compatibility
          score,
          userData: storedFace.userData,
          matched: score >= 0.4,
        };
      }
    }

    if (bestMatch && bestMatch.matched) {
      // Dispatch event for successful authentication
      dispatchVerificationEvent("authenticate", true, bestMatch.userData);
    } else if (bestMatch) {
      // Dispatch event for failed authentication (score too low)
      dispatchVerificationEvent("authenticate", false);
    }

    return bestMatch;
  } catch (error) {
    console.error("Error finding matching face:", error);

    // Dispatch event for failed authentication
    dispatchVerificationEvent("authenticate", false);

    return null;
  }
}

// Clear all stored faces
export function clearStoredFaces(): void {
  try {
    localStorage.removeItem("storedFaces");
    storedFaces = [];
    console.log("All stored faces cleared");

    // Dispatch event for clearing faces
    dispatchVerificationEvent("clear", true);
  } catch (error) {
    console.error("Error clearing stored faces:", error);
  }
}

// Get the number of stored faces
export function getStoredFacesCount(): number {
  return getStoredFaces().length;
}

// List stored faces (without sensitive data)
export function listStoredFaces(): Array<{
  id: string;
  userData: UserData;
  createdAt: string;
}> {
  return getStoredFaces().map((face) => {
    return {
      id: face.id,
      userData: face.userData,
      createdAt: face.createdAt,
    };
  });
}

// Extract face descriptor from an image with custom options
export async function extractFaceDescriptorWithOptions(
  imageElement: HTMLImageElement,
  options: {
    minConfidence?: number;
    enlargeFactor?: number;
  } = {},
): Promise<Float32Array | null> {
  if (!isInitialized) {
    console.error("Face API models not initialized. Call initFaceApi() first.");
    return null;
  }

  const minConfidence = options.minConfidence || 0.5; // Default confidence threshold
  const enlargeFactor = options.enlargeFactor || 0.0; // Default no enlargement

  try {
    // Make sure the image is fully loaded
    if (!imageElement.complete) {
      await new Promise((resolve) => {
        imageElement.onload = resolve;
      });
    }

    console.log(
      `Detecting face with options: minConfidence=${minConfidence}, enlargeFactor=${enlargeFactor}`,
    );
    console.log(
      "Image dimensions:",
      imageElement.width,
      "x",
      imageElement.height,
    );

    if (imageElement.width === 0 || imageElement.height === 0) {
      console.error("Image has invalid dimensions (0x0)");
      return null;
    }

    // Create a canvas element and draw the image to it for better processing
    const canvas = document.createElement("canvas");
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get canvas context");
      return null;
    }

    // Draw the image to the canvas
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    // Set detection options
    const detectionOptions = new faceapi.SsdMobilenetv1Options({
      minConfidence,
      maxResults: 1,
    });

    // Try to detect a face
    const detections = await faceapi.detectSingleFace(canvas, detectionOptions);

    if (!detections) {
      console.log("No face detected in the image with current options");
      return null;
    }

    console.log("Face detected with confidence:", detections.score);

    // Try to detect and compute everything in one step
    const fullFaceDescription = await faceapi
      .detectSingleFace(canvas, detectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!fullFaceDescription) {
      console.log("Could not compute full face description");
      return null;
    }

    console.log("Face descriptor successfully computed with custom options");
    return fullFaceDescription.descriptor;
  } catch (error) {
    console.error("Error extracting face descriptor with options:", error);
    return null;
  }
}

