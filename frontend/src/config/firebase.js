import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_T0pCMFwHg4Y9_1Fly__nWqIdj0_braM",
  authDomain: "reminder-e026c.firebaseapp.com",
  projectId: "reminder-e026c",
  storageBucket: "reminder-e026c.firebasestorage.app",
  messagingSenderId: "804274183797",
  appId: "1:804274183797:web:df1e8988e9c161206ee23c",
  measurementId: "G-DZ7ZP1V9P4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { db, auth, analytics };
