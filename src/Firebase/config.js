// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
apiKey: "AIzaSyBKL3YgLEvcDdJehajS_Q9dMwh1H2U57lk",
  authDomain: "vehiclechain-b665d.firebaseapp.com",
  projectId: "vehiclechain-b665d",
  storageBucket: "vehiclechain-b665d.firebasestorage.app",
  messagingSenderId: "287785279863",
  appId: "1:287785279863:web:4222bef78035ddd9a5c172"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();


export { auth, provider, signInWithPopup, db};
