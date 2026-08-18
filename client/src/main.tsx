import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log("GOOGLE CLIENT ID:", googleClientId);

if (!googleClientId) {
  console.error(
    "VITE_GOOGLE_CLIENT_ID is missing. Check client/.env"
  );
}

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
);