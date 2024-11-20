import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
// My firebaseConfig
// const firebaseConfig = {
//   apiKey: "AIzaSyA0Z7yoZUD16QRL9VBUDu4nkkz8luu0iwE",
//   authDomain: "solar-calc-6936b.firebaseapp.com",
//   projectId: "solar-calc-6936b",
//   storageBucket: "solar-calc-6936b.appspot.com",
//   messagingSenderId: "804214657145",
//   appId: "1:804214657145:web:cc03e27eb05e4eebb344a8",
//   measurementId: "G-NZ6QWT4TD1",
// };

// Client firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyBa3C_jSxFm92YfPfrAB9Ems0EF9ap4sd0",
  authDomain: "solar-glare.firebaseapp.com",
  projectId: "solar-glare",
  storageBucket: "solar-glare.appspot.com",
  messagingSenderId: "182146151482",
  appId: "1:182146151482:web:429903b44ae8109efb3103",
  measurementId: "G-DEY66MDXTW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
export { db, auth, googleProvider, storage, facebookProvider };
