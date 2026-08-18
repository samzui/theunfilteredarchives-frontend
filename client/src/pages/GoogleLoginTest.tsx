import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://theunfilteredarchives-blog.onrender.com";

export default function GoogleLoginTest() {
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");

  async function handleGoogleSuccess(
    credentialResponse: any
  ) {
    try {
      setMessage("Google sign-in successful. Sending to backend...");
      setToken("");

      if (!credentialResponse?.credential) {
        setMessage("Google did not return a credential.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Backend Google login failed:", data);

        setMessage(
          data?.detail ||
            "Google login failed on the backend."
        );

        return;
      }

      if (!data.access_token) {
        setMessage(
          "Backend responded, but no access token was returned."
        );

        return;
      }

      // Store the same JWT used by the rest of your application.
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      setToken(data.access_token);

      setMessage(
        "Google login successful! Your application JWT was created."
      );
    } catch (error) {
      console.error("Google login error:", error);

      setMessage(
        "Could not connect to the backend."
      );
    }
  }

  function handleGoogleError() {
    console.error("Google sign-in failed.");

    setMessage(
      "Google sign-in was cancelled or failed."
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf7fa",
        fontFamily:
          '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: "420px",
          maxWidth: "90%",
          background: "#fff",
          border: "1px solid #e2d7e0",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily:
              'Georgia, "Times New Roman", serif',
            fontWeight: 400,
            color: "#342332",
            marginBottom: "10px",
          }}
        >
          Google Sign-In Test
        </h1>

        <p
          style={{
            color: "#806b7b",
            fontSize: "14px",
            marginBottom: "30px",
          }}
        >
          Sign in with Google to test the authentication
          connection.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        {message && (
          <div
            style={{
              marginTop: "25px",
              padding: "15px",
              background: "#f5f0f5",
              color: "#5f4b5c",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}

        {token && (
          <div
            style={{
              marginTop: "20px",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#806b7b",
                marginBottom: "6px",
              }}
            >
              JWT received successfully.
            </p>

            <div
              style={{
                padding: "10px",
                background: "#faf7fa",
                border: "1px solid #eadfe7",
                fontSize: "11px",
                wordBreak: "break-all",
                color: "#624f5e",
              }}
            >
              {token}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}