import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBSMBPzArXG1RVsE_rk8nTCqzMVDYDa87U",
  authDomain: "bitebridge-5aef1.firebaseapp.com",
  projectId: "bitebridge-5aef1",
  storageBucket: "bitebridge-5aef1.firebasestorage.app",
  messagingSenderId: "508817916157",
  appId: "1:508817916157:web:902f2bc79469849c0e3e94",
  measurementId: "G-CZNXTFBCV0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google popup login helper
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
