import { auth } from './firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider, 
  signInWithPopup, 
  FacebookAuthProvider  
} from 'firebase/auth';


export const firebaseRegister = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User registered successfully:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("Error during registration:", error.code, error.message);
    throw error;
  }
};

export const firebaseLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in successfully:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("Error during login:", error.code, error.message);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Google sign-in successful:", user.email);
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error.code, error.message);
    throw error; // Re-throw so the calling function can handle it
  }
};

export const signInWithFacebook = async () => {
  const provider = new FacebookAuthProvider(); // FIXED: Was GoogleAuthProvider
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Facebook sign-in successful:", user.email);
    return user;
  } catch (error) {
    console.error("Error signing in with Facebook:", error.code, error.message);
    throw error; // Re-throw so the calling function can handle it
  }
};