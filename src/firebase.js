// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKKka7QTjiwyj8eE5hvLpPLdvls_bCsZE",
  authDomain: "sales-tracker-456605.firebaseapp.com",
  projectId: "sales-tracker-456605",
  storageBucket: "sales-tracker-456605.firebasestorage.app",
  messagingSenderId: "214994340542",
  appId: "1:214994340542:web:825344c4fdf9a02f082cef",
  measurementId: "G-JJQSV6DDKF"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app); // Keep if you're using Firestore


export { app, auth, db };