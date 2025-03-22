/**
 * User data management utility functions
 * This file provides centralized methods for managing user-specific data in localStorage
 */

export interface UserData {
  applicantId: string;
  loanApplicationId: string;
  email?: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * Get the current authenticated user data
 * @returns The user data object or null if no user is authenticated
 */
export function getCurrentUser(): UserData | null {
  try {
    const userData = localStorage.getItem('currentUserData');
    if (!userData) return null;
    return JSON.parse(userData);
  } catch (error) {
    console.error('Failed to parse current user data', error);
    return null;
  }
}

/**
 * Get a user-specific item from localStorage
 * @param key The base key name
 * @param defaultValue Optional default value if item doesn't exist
 * @returns The stored value or defaultValue if not found
 */
export function getUserItem<T>(key: string, defaultValue: T | null = null): T | null {
  const user = getCurrentUser();
  
  try {
    if (user) {
      // Try user-specific key first
      const userKey = `${key}_${user.applicantId}`;
      const userValue = localStorage.getItem(userKey);
      
      if (userValue) {
        return JSON.parse(userValue);
      }
    }
    
    // Fall back to general key
    const generalValue = localStorage.getItem(key);
    if (generalValue) {
      try {
        return JSON.parse(generalValue);
      } catch (e) {
        console.error(`Error parsing ${key} from localStorage:`, e);
        return defaultValue;
      }
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Error retrieving user item ${key}`, error);
    return defaultValue;
  }
}

/**
 * Set a user-specific item in localStorage
 * @param key The base key name
 * @param value The value to store
 * @param keepGeneral Whether to also update the general key (for backwards compatibility)
 */
export function setUserItem<T>(key: string, value: T, keepGeneral: boolean = true): void {
  const user = getCurrentUser();
  const valueStr = JSON.stringify(value);
  
  if (user) {
    // Store with user-specific key
    const userKey = `${key}_${user.applicantId}`;
    localStorage.setItem(userKey, valueStr);
  }
  
  // Always store with general key if no user is authenticated or keepGeneral is true
  if (keepGeneral || !user) {
    localStorage.setItem(key, valueStr);
  }
}

/**
 * Clear all user-specific data for the current user
 */
export function clearCurrentUserData(): void {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    const applicantId = user.applicantId;
    
    // Clear standard keys
    localStorage.removeItem(`financialAnswers_${applicantId}`);
    localStorage.removeItem(`applicationData_${applicantId}`);
    localStorage.removeItem(`approvalResult_${applicantId}`);
    
    // Clear any additional keys that may be user-specific
    // This helps future-proof the application as new user-specific data is added
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith(`_${applicantId}`)) {
        localStorage.removeItem(key);
      }
    }
    
    // Keep the currentUserData for session purposes
  } catch (error) {
    console.error('Error clearing user data', error);
  }
}

/**
 * Complete logout - clears user session and all related data
 */
export function logoutUser(): void {
  clearCurrentUserData();
  localStorage.removeItem('currentUserData');
  
  // Clear general keys too
  localStorage.removeItem('financialAnswers');
  localStorage.removeItem('applicationData');
  localStorage.removeItem('approvalResult');
  localStorage.removeItem('currentApplication');
} 