import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import app from './firebaseConfig';

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Get current user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with user object or null
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} User credential
 */
export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Create new account with email and password
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<Object>} User credential
 */
export async function signUpWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  
  return result.user;
}

/**
 * Sign in with Google
 * @returns {Promise<Object>} User credential
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out current user
 */
export async function logout() {
  await signOut(auth);
}

export { auth };
