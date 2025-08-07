import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC5UweP5t-_-mwcXUFc-YPTzIWVe-ar79o",  
    authDomain: "godhaar-test.firebaseapp.com",  
    projectId: "godhaar-test",  
    storageBucket: "godhaar-test.firebasestorage.app",
    messagingSenderId: "601461869022",
    appId: "1:601461869022:web:178bd9f7ab77967279754f"
  };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db }; 
