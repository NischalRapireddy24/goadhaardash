import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD9jHi-4KfD5pHBOKFVWayW1ba8stkC9GU",
    authDomain: "gaadhaar-987dd.firebaseapp.com",
    projectId: "gaadhaar-987dd",
    storageBucket: "gaadhaar-987dd.appspot.com",
    messagingSenderId: "202045537230",
    appId: "1:202045537230:web:4c445a3b26e3686333099f"
  };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db }; 