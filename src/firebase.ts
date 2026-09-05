import { initializeApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCOJwbs8uwIu-wKQ6wp8Wj8WgT3IWxVAHU",
  authDomain: "lexops-prod-2026-sa.firebaseapp.com",
  projectId: "lexops-prod-2026-sa",
  storageBucket: "lexops-prod-2026-sa.firebasestorage.app",
  messagingSenderId: "831884144386",
  appId: "1:831884144386:web:060283642bc659f5d01c1b",
  measurementId: "G-7TCF8S80LR"
};

let app;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}
export const auth = getAuth(app);
