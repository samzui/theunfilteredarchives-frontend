
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

export default function AdminLogin() {
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loginResponse = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      if (!loginResponse.ok) {
        const data = await loginResponse.json().catch(() => null);

        throw new Error(
          data?.detail || "Invalid email or password."
        );
      }

      const loginData = await loginResponse.json();

      const token = loginData.access_token;

      if (!token) {
        throw new Error("Login succeeded, but no access token was returned.");
      }

      // Verify that the logged-in account is actually an ADMIN.
      const meResponse = await fetch(
        `${API_BASE_URL}/api/auth/me`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!meResponse.ok) {
        throw new Error("Unable to verify administrator account.");
      }

      const user = await meResponse.json();

      if (user.role !== "ADMIN") {
        throw new Error("This account does not have administrator access.");
      }

      // Store the JWT so the admin dashboard can use it.
      localStorage.setItem("admin_access_token", token);

      // Store basic admin information for the frontend.
      localStorage.setItem("admin_user", JSON.stringify(user));

      // Go to the admin dashboard.
      setLocation("/admin");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f8f3f7",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          padding: "42px",
          borderRadius: "4px",
          boxShadow: "0 12px 40px rgba(70, 45, 65, 0.08)",
        }}
      >
        <div style={{ marginBottom: "34px" }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#8b7187",
            }}
          >
            Unfiltered Archives
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 400,
              color: "#342b35",
            }}
          >
            Admin login
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#817480",
            }}
          >
            Sign in to manage your writings and archive.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="admin-email"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "12px",
                letterSpacing: "0.04em",
                color: "#5e505b",
              }}
            >
              Email
            </label>

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your admin email"
              required
              autoComplete="email"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                border: "1px solid #ded5dc",
                borderRadius: "2px",
                outline: "none",
                background: "#fff",
                color: "#342b35",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label
              htmlFor="admin-password"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "12px",
                letterSpacing: "0.04em",
                color: "#5e505b",
              }}
            >
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                border: "1px solid #ded5dc",
                borderRadius: "2px",
                outline: "none",
                background: "#fff",
                color: "#342b35",
                fontSize: "14px",
              }}
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{
                margin: "0 0 18px",
                padding: "11px 12px",
                background: "#fbefef",
                color: "#a24d5a",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "2px",
              background: "#594454",
              color: "#fff",
              fontSize: "13px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
