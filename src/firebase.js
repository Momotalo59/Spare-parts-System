
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// --- Firebase Configuration ---
// This object contains your project's unique identifiers and is used to connect
// to the correct Firebase project on Google's servers.
const firebaseConfig = {
  apiKey: "AIzaSyBm1GeBr0vkmAfOPRwM9RiPgs1ykYT0ypI",
  authDomain: "spare-parts-5cfc6.firebaseapp.com",
  projectId: "spare-parts-5cfc6",
  storageBucket: "spare-parts-5cfc6.appspot.com",
  messagingSenderId: "207885688660",
  appId: "1:207885688660:web:0c2d1c887d8dd75dbbb2c1"
};

// --- Initialize Firebase Services ---

// Initialize the main Firebase app with the configuration.
const app = initializeApp(firebaseConfig);

// Get a reference to the Firestore database service.
// This will now ALWAYS connect to the live Cloud Firestore database.
const db = getFirestore(app);

// Get a reference to the Firebase Authentication service.
// This will now ALWAYS connect to the live Authentication service.
const auth = getAuth(app);

// Get a reference to the Firebase Functions service.
const functions = getFunctions(app);


// --- Exports ---
// Export the initialized services so they can be used throughout the application.
export { db, auth, functions, firebaseConfig };
