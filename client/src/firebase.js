import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAB32flpqaT6cmlaVwPh3JXLgyRNuhh8ZQ",
  authDomain: "quiz0app.firebaseapp.com",
  projectId: "quiz0app",
  storageBucket: "quiz0app.firebasestorage.app",
  messagingSenderId: "622012264890",
  appId: "1:622012264890:web:9bf24843ee0e53a3d02d83",
  measurementId: "G-SJ1QHR8YVR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

