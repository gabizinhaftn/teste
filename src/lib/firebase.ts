import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB4ml1XaalMGRGpggyYCCEV-gV6HvFdsRU",
  authDomain: "cantodecaboclo.firebaseapp.com",
  projectId: "cantodecaboclo",
  storageBucket: "cantodecaboclo.firebasestorage.app",
  messagingSenderId: "60817587213",
  appId: "1:60817587213:web:56f52310940ff03e45a944",
  measurementId: "G-ENW7G0PXR3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
