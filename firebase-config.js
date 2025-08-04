// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB6JMscG7PmcJbbNRJlxAgXnbJqPXBbWfQ",
  authDomain: "infraestrutura-inovar.firebaseapp.com",
  projectId: "infraestrutura-inovar",
  storageBucket: "infraestrutura-inovar.firebasestorage.app",
  messagingSenderId: "365911816619",
  appId: "1:365911816619:web:271ac3bdbd37b58be4faee",
  measurementId: "G-7FBZ35DPFS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;