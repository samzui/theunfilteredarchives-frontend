
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type Writing = {
  id: number;
  title: string;
  status: string;
  featured?: boolean;
  view_count?: number;
  updated_at?: string;
  created_at?: string;
};

const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

/*
 * IMPORTANT:
 * Your login page may have stored the JWT under a different key.
 * This checks all keys we have used during the admin setup.
 */
function getToken(): string | null {
  const keys = [
    "admin_access_token",
    "access_token",
    "accessToken",
    "token",
    "jwt",
    "admin_token",
    "adminToken",
  ];

  for (const key of keys) {
    const localToken = localStorage.getItem(key);

    if (localToken) {
      return localToken;
    }

    const sessionToken = sessionStorage.getItem(key);

    if (sessionToken) {
      return sessionToken;
    }
  }

  return null;
}

function clearAuth() {
  const keys = [
    "admin_access_token",
    "access_token",
    "accessToken",
    "token",
    "jwt",
    "admin_token",
    "adminToken",
  ];

  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function authHeaders(): HeadersInit {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminWritings() {
  const [, setLocation] = useLocation();

  const [writings, setWritings] = useState<Writing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  async function loadWritings() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      /*
       * Do NOT redirect simply because the token isn't under one
       * particular localStorage key.
       *
       * We have already checked every supported key above.
       */
      if (!token) {
        setError(
          "No admin session was found. Please log in again."
        );
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/writings/admin/all`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      if (response.status === 401) {
        clearAuth();
        setError(
          "Your admin session has expired. Please log in again."
        );
        return;
      }

      if (response.status === 403) {
        setError(
          "This account does not have administrator access."
        );
        return;
      }

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || "Failed to load writings."
        );
      }

      const data = await response.json();

      setWritings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load writings:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load writings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWritings();
  }, []);

  async function handleDelete(id: number) {
  try {
      setDeletingId(id);

      const token = getToken();

      if (!token) {
        setLocation("/admin/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/writings/${id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      if (response.status === 401) {
        clearAuth();
        setLocation("/admin/login");
        return;
      }

      if (response.status === 403) {
        alert("You do not have permission to delete this writing.");
        return;
      }

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || "Failed to delete writing."
        );
      }

      setWritings((current) =>
        current.filter((writing) => writing.id !== id)
      );
    } catch (err) {
      console.error("Delete failed:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete this writing."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function editWriting(id: number) {
    setLocation(`/admin/writings/${id}/edit`);
  }

  function createWriting() {
    setLocation("/admin/writings/new");
  }

  function logout() {
    clearAuth();
    setLocation("/admin/login");
  }

  const navButton = (
    active: boolean
  ): React.CSSProperties => ({
    width: "100%",
    border: "none",
    background: active ? "#f1e6ef" : "transparent",
    color: "#6f5369",
    textAlign: "left",
    padding: "14px 18px",
    borderRadius: "2px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "15px",
  });

  const actionButton: React.CSSProperties = {
    border: "1px solid #e3d5df",
    background: "#fff",
    color: "#755b70",
    padding: "10px 16px",
    borderRadius: "3px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "14px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf7fa",
        color: "#3e2d3c",
        fontFamily:
          '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
        display: "flex",
      }}
    >
      {/* SIDEBAR */}

      <aside
        style={{
          width: "300px",
          minHeight: "100vh",
          background: "#fff",
          borderRight: "1px solid #eadfe7",
          padding: "45px 30px 30px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: "65px" }}>
          <div
            style={{
              fontSize: "13px",
              letterSpacing: "0.16em",
              color: "#9b788f",
              marginBottom: "10px",
            }}
          >
            UNFILTERED ARCHIVES
          </div>

          <div
            style={{
              fontFamily:
                "Georgia, 'Times New Roman', serif",
              fontSize: "30px",
              color: "#342332",
            }}
          >
            ADMIN
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => setLocation("/admin")}
            style={navButton(false)}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => setLocation("/admin/writings")}
            style={navButton(true)}
          >
            Writings
          </button>

                    <button
            type="button"
            onClick={() => setLocation("/admin/community")}
            style={navButton(false)}
          >
            Community
          </button>

          <button
            type="button"
            onClick={() => setLocation("/admin/comments")}
            style={navButton(false)}
          >
            Comments
          </button>

          <button
            type="button"
            onClick={() => setLocation("/admin/users")}
            style={navButton(false)}
          >
            Users
          </button>

          <button
            type="button"
            onClick={() => setLocation("/admin/reports")}
            style={navButton(false)}
          >
            Reports
          </button>
        </nav>

        <button
          type="button"
          onClick={logout}
          style={{
            marginTop: "auto",
            border: "none",
            background: "transparent",
            color: "#a46b7d",
            textAlign: "left",
            padding: "14px 18px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "15px",
          }}
        >
          Log out
        </button>
      </aside>

      {/* MAIN */}

      <main
        style={{
          flex: 1,
          padding: "50px 60px 70px",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* HEADER */}

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "30px",
              marginBottom: "55px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  letterSpacing: "0.18em",
                  color: "#9b788f",
                  marginBottom: "22px",
                }}
              >
                CONTENT
              </div>

              <h1
                style={{
                  margin: 0,
                  fontFamily:
                    "Georgia, 'Times New Roman', serif",
                  fontWeight: 400,
                  fontSize: "48px",
                  lineHeight: 1,
                  color: "#342332",
                }}
              >
                WRITINGS
              </h1>
            </div>

            <button
              type="button"
              onClick={createWriting}
              style={{
                border: "none",
                background: "#674f64",
                color: "#fff",
                padding: "17px 24px",
                borderRadius: "2px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "14px",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              + NEW WRITING
            </button>
          </div>

          {/* ERROR */}

          {error && (
            <div
              style={{
                background: "#fff0f1",
                border: "1px solid #ead1d5",
                color: "#955c67",
                padding: "16px 20px",
                marginBottom: "25px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <span>{error}</span>

              <button
                type="button"
                onClick={() => {
                  clearAuth();
                  setLocation("/admin/login");
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#674f64",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Login again
              </button>
            </div>
          )}

          {/* LOADING */}

          {loading ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #eadfe7",
                padding: "60px",
                textAlign: "center",
                color: "#8c7485",
              }}
            >
              Loading writings...
            </div>
          ) : writings.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #eadfe7",
                padding: "70px 30px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily:
                    "Georgia, 'Times New Roman', serif",
                  fontSize: "28px",
                  color: "#493646",
                  marginBottom: "12px",
                }}
              >
                No writings yet
              </div>

              <p
                style={{
                  color: "#907d8b",
                  marginBottom: "25px",
                }}
              >
                Start your archive by creating your first writing.
              </p>

              <button
                type="button"
                onClick={createWriting}
                style={{
                  ...actionButton,
                  background: "#674f64",
                  color: "#fff",
                  borderColor: "#674f64",
                }}
              >
                Create Writing
              </button>
            </div>
          ) : (
            <div
              style={{
                background: "#fff",
                border: "1px solid #eadfe7",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "850px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    {["TITLE", "STATUS", "UPDATED", "ACTIONS"].map(
                      (heading) => (
                        <th
                          key={heading}
                          style={{
                            textAlign: "left",
                            padding: "22px 28px",
                            borderBottom:
                              "1px solid #eadfe7",
                            color: "#9b788f",
                            fontSize: "12px",
                            letterSpacing: "0.13em",
                            fontWeight: 400,
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {writings.map((writing) => (
                    <tr key={writing.id}>
                      <td
                        style={{
                          padding: "28px",
                          borderBottom:
                            "1px solid #eadfe7",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontFamily:
                                "Georgia, 'Times New Roman', serif",
                              fontSize: "18px",
                              color: "#3f2d3d",
                            }}
                          >
                            {writing.title || "Untitled"}
                          </span>

                          {writing.featured && (
                            <span
                              style={{
                                color: "#a36d82",
                                fontSize: "11px",
                                letterSpacing: "0.08em",
                              }}
                            >
                              FEATURED
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: "12px",
                            color: "#9b8994",
                            fontSize: "13px",
                          }}
                        >
                          {writing.view_count ?? 0} views
                        </div>
                      </td>

                      <td
                        style={{
                          padding: "28px",
                          borderBottom:
                            "1px solid #eadfe7",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "8px 13px",
                            borderRadius: "3px",
                            background:
                              writing.status === "PUBLISHED"
                                ? "#edf5ee"
                                : "#f3eaf3",
                            color:
                              writing.status === "PUBLISHED"
                                ? "#587b60"
                                : "#84677f",
                            fontSize: "12px",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {(
                            writing.status || "DRAFT"
                          ).toUpperCase()}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "28px",
                          borderBottom:
                            "1px solid #eadfe7",
                          color: "#756473",
                          fontSize: "14px",
                        }}
                      >
                        {formatDate(
                          writing.updated_at ||
                            writing.created_at
                        )}
                      </td>

                      <td
                        style={{
                          padding: "28px",
                          borderBottom:
                            "1px solid #eadfe7",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              editWriting(writing.id)
                            }
                            style={actionButton}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId === writing.id
                            }
                            onClick={() =>
  setDeleteConfirmId(writing.id)
}
                            style={{
                              ...actionButton,

                              color: "#a65f70",
                              opacity:
                                deletingId === writing.id
                                  ? 0.6
                                  : 1,
                              cursor:
                                deletingId === writing.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {deletingId === writing.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && (
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={loadWritings}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#876f80",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "13px",
                }}
              >
                Refresh writings ↻
              </button>
            </div>
          )}
        </div>
      </main>
      {deleteConfirmId !== null && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(62, 45, 60, 0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "20px",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: "430px",
        background: "#fff",
        padding: "32px",
        borderRadius: "4px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        color: "#3e2d3c",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#8b6b82",
          marginBottom: "12px",
        }}
      >
        Delete writing
      </div>

      <h2
        style={{
          margin: "0 0 12px",
          fontFamily: "Georgia, serif",
          fontSize: "28px",
          fontWeight: 400,
        }}
      >
        Are you sure?
      </h2>

      <p
        style={{
          margin: "0 0 28px",
          color: "#6f5b6b",
          fontSize: "15px",
          lineHeight: 1.6,
        }}
      >
        Are you sure you want to delete this writing?
        This cannot be undone.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => setDeleteConfirmId(null)}
          style={{
            border: "1px solid #e3d5df",
            background: "#fff",
            color: "#755b70",
            padding: "11px 20px",
            borderRadius: "3px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "14px",
          }}
        >
          No
        </button>

        <button
          type="button"
          onClick={() => {
            const id = deleteConfirmId;
            setDeleteConfirmId(null);
            handleDelete(id);
          }}
          style={{
            border: "none",
            background: "#3e2d3c",
            color: "#fff",
            padding: "11px 20px",
            borderRadius: "3px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "14px",
          }}
        >
          Yes, Delete
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

