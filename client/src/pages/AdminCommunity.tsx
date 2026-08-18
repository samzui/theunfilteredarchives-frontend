import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

type CommunitySubmission = {
  id: number;
  name: string;
  email: string;
  title: string;
  content: string;
  consent: boolean;
  status:
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | string;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
};

export default function AdminCommunity() {
  const [, setLocation] = useLocation();

  const [submissions, setSubmissions] = useState<
    CommunitySubmission[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] =
    useState<number | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] =
    useState<number | null>(null);

  /*
   * -------------------------------------------------------
   * GET ADMIN TOKEN
   * -------------------------------------------------------
   */

  function getToken() {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("admin_access_token")
    );
  }

  /*
   * -------------------------------------------------------
   * LOGOUT
   * -------------------------------------------------------
   */

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");

    setLocation("/admin/login");
  }

  /*
   * -------------------------------------------------------
   * LOAD COMMUNITY SUBMISSIONS
   * -------------------------------------------------------
   */

  async function loadSubmissions() {
    const token = getToken();

    if (!token) {
      setLocation("/admin/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/community/submissions`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load community submissions."
        );
      }

      const data = await response.json();

      setSubmissions(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load community submissions."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * -------------------------------------------------------
   * INITIAL LOAD
   * -------------------------------------------------------
   */

  useEffect(() => {
    loadSubmissions();
  }, []);

  /*
   * -------------------------------------------------------
   * APPROVE / REJECT SUBMISSION
   * -------------------------------------------------------
   */

  async function updateSubmissionStatus(
    submissionId: number,
    status: "APPROVED" | "REJECTED"
  ) {
    const token = getToken();

    if (!token) {
      setLocation("/admin/login");
      return;
    }

    try {
      setActionLoading(submissionId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/community/submissions/${submissionId}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail ||
            `Unable to ${status === "APPROVED" ? "approve" : "reject"} submission.`
        );
      }

      await loadSubmissions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update submission."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /*
   * -------------------------------------------------------
   * PUBLISH APPROVED SUBMISSION
   * -------------------------------------------------------
   */

  async function publishSubmission(submissionId: number) {
    const token = getToken();

    if (!token) {
      setLocation("/admin/login");
      return;
    }

    try {
      setActionLoading(submissionId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/community/submissions/${submissionId}/publish`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail || "Unable to publish submission."
        );
      }

      await loadSubmissions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish submission."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /*
   * -------------------------------------------------------
   * DELETE COMMUNITY SUBMISSION
   * -------------------------------------------------------
   */

  async function deleteSubmission(submissionId: number) {
    const token = getToken();

    if (!token) {
      setLocation("/admin/login");
      return;
    }

    try {
      setActionLoading(submissionId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/community/submissions/${submissionId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to delete submission."
        );
      }

      await loadSubmissions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete submission."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /*
   * -------------------------------------------------------
   * STATUS STYLING
   * -------------------------------------------------------
   */

  function getStatusColor(status: string) {
    if (status === "APPROVED") {
      return "#58745f";
    }

    if (status === "PUBLISHED") {
      return "#58745f";
    }

    if (status === "REJECTED") {
      return "#a24d5a";
    }

    return "#8b7187";
  }

  /*
   * -------------------------------------------------------
   * DATE FORMAT
   * -------------------------------------------------------
   */

  function formatDate(dateString: string) {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  /*
   * -------------------------------------------------------
   * PAGE
   * -------------------------------------------------------
   */

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f8f3f7",
        color: "#342b35",
      }}
    >
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        style={{
          width: "240px",
          minHeight: "100vh",
          boxSizing: "border-box",
          padding: "34px 24px",
          background: "#fff",
          borderRight: "1px solid #e8dfe6",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#8b7187",
            }}
          >
            Unfiltered Archives
          </p>

          <h1
            style={{
              margin: "8px 0 0",
              fontSize: "24px",
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            Admin
          </h1>
        </div>

        <nav
          style={{
            marginTop: "48px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {/* Dashboard */}

          <button
            type="button"
            onClick={() => setLocation("/admin")}
            style={{
              textAlign: "left",
              border: "none",
              background: "transparent",
              color: "#6f626c",
              padding: "12px 14px",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Dashboard
          </button>

          {/* Writings */}

          <button
            type="button"
            onClick={() =>
              setLocation("/admin/writings")
            }
            style={{
              textAlign: "left",
              border: "none",
              background: "transparent",
              color: "#6f626c",
              padding: "12px 14px",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Writings
          </button>

          {/* Community */}

          <button
            type="button"
            style={{
              textAlign: "left",
              border: "none",
              background: "#f3eaf1",
              color: "#594454",
              padding: "12px 14px",
              borderRadius: "2px",
              cursor: "default",
              fontSize: "13px",
            }}
          >
            Community
          </button>

          {/* Comments */}

          <button
            type="button"
            onClick={() =>
              setLocation("/admin/comments")
            }
            style={{
              textAlign: "left",
              border: "none",
              background: "transparent",
              color: "#6f626c",
              padding: "12px 14px",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Comments
          </button>

          {/* Users */}

          <button
            type="button"
            onClick={() =>
              setLocation("/admin/users")
            }
            style={{
              textAlign: "left",
              border: "none",
              background: "transparent",
              color: "#6f626c",
              padding: "12px 14px",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Users
          </button>

          {/* Reports */}

          <button
            type="button"
            onClick={() =>
              setLocation("/admin/reports")
            }
            style={{
              textAlign: "left",
              border: "none",
              background: "transparent",
              color: "#6f626c",
              padding: "12px 14px",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Reports
          </button>
        </nav>

        {/* Logout */}

        <button
          type="button"
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            textAlign: "left",
            border: "none",
            background: "transparent",
            color: "#9a6570",
            padding: "12px 14px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Log out
        </button>
      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main
        style={{
          flex: 1,
          padding: "48px",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        {/* Header */}

        <header
          style={{
            marginBottom: "40px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#8b7187",
            }}
          >
            From the community
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: "38px",
              fontWeight: 400,
              letterSpacing: "-0.03em",
            }}
          >
            Community submissions.
          </h2>

          <p
            style={{
              margin: "12px 0 0",
              maxWidth: "650px",
              fontSize: "14px",
              lineHeight: 1.7,
              color: "#817480",
            }}
          >
            Stories, thoughts and pieces submitted by
            readers for consideration in the archive.
          </p>
        </header>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <p
            style={{
              fontSize: "14px",
              color: "#817480",
            }}
          >
            Loading community submissions...
          </p>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              padding: "14px 16px",
              marginBottom: "24px",
              background: "#fbefef",
              color: "#a24d5a",
              fontSize: "13px",
              border: "1px solid #f0dfe2",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {!loading &&
          !error &&
          submissions.length === 0 && (
            <section
              style={{
                background: "#fff",
                border: "1px solid #e8dfe6",
                padding: "28px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#8b7187",
                }}
              >
                Nothing here yet
              </p>

              <h3
                style={{
                  margin: "10px 0 0",
                  fontSize: "24px",
                  fontWeight: 400,
                }}
              >
                No community submissions.
              </h3>

              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "#817480",
                }}
              >
                New pieces submitted through the website
                will appear here for review.
              </p>
            </section>
          )}

        {/* =================================================
            SUBMISSIONS
        ================================================= */}

        {!loading &&
          submissions.length > 0 && (
            <section
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {submissions.map((submission) => {
                return (
                  <article
                    key={submission.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e8dfe6",
                      padding: "28px",
                    }}
                  >
                    {/* Top row */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "flex-start",
                        gap: "24px",
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: "11px",
                            letterSpacing:
                              "0.1em",
                            textTransform:
                              "uppercase",
                            color: "#8b7187",
                          }}
                        >
                          Community submission
                        </p>

                        <h3
                          style={{
                            margin: 0,
                            fontSize: "28px",
                            fontWeight: 400,
                            letterSpacing:
                              "-0.02em",
                            color: "#342b35",
                          }}
                        >
                          {submission.title}
                        </h3>
                      </div>

                      {/* Status */}

                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: "10px",
                          letterSpacing:
                            "0.1em",
                          textTransform:
                            "uppercase",
                          color:
                            getStatusColor(
                              submission.status
                            ),
                          paddingTop: "4px",
                        }}
                      >
                        {submission.status}
                      </span>
                    </div>

                    {/* Author details */}

                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px 18px",
                        fontSize: "13px",
                        color: "#817480",
                      }}
                    >
                      <span>
                        By {submission.name}
                      </span>

                      <span>
                        {submission.email}
                      </span>

                      <span>
                        Submitted{" "}
                        {formatDate(
                          submission.created_at
                        )}
                      </span>
                    </div>

                    {/* Divider */}

                    <div
                      style={{
                        height: "1px",
                        background:
                          "#e8dfe6",
                        margin:
                          "24px 0",
                      }}
                    />

                    {/* Writing */}

                    <div
                      style={{
                        background: "#f8f3f7",
                        padding: "22px",
                        color: "#594454",
                        fontSize: "15px",
                        lineHeight: 1.85,
                        whiteSpace:
                          "pre-wrap",
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {submission.content}
                    </div>

                    {/* Consent */}

                    <p
                      style={{
                        margin:
                          "18px 0 0",
                        fontSize: "12px",
                        color: "#817480",
                      }}
                    >
                      Consent to publication:{" "}
                      <strong
                        style={{
                          color:
                            submission.consent
                              ? "#58745f"
                              : "#a24d5a",
                          fontWeight: 500,
                        }}
                      >
                        {submission.consent
                          ? "Yes"
                          : "No"}
                      </strong>
                    </p>

                    {/* Already reviewed */}

                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    {submission.status === "PENDING" ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "24px",
                          paddingTop: "20px",
                          borderTop: "1px solid #e5d9e2",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            actionLoading ===
                            submission.id
                          }
                          onClick={() =>
                            updateSubmissionStatus(
                              submission.id,
                              "APPROVED"
                            )
                          }
                          style={{
                            border:
                              "1px solid #6f5268",
                            background: "#674f64",
                            color: "#fff",
                            padding:
                              "10px 18px",
                            cursor: "pointer",
                            fontSize: "12px",
                            letterSpacing:
                              "0.06em",
                          }}
                        >
                          {actionLoading ===
                          submission.id
                            ? "Approving..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionLoading ===
                            submission.id
                          }
                          onClick={() =>
                            updateSubmissionStatus(
                              submission.id,
                              "REJECTED"
                            )
                          }
                          style={{
                            border:
                              "1px solid #cbbbc7",
                            background:
                              "transparent",
                            color: "#765d70",
                            padding:
                              "10px 18px",
                            cursor: "pointer",
                            fontSize: "12px",
                            letterSpacing:
                              "0.06em",
                          }}
                        >
                          {actionLoading ===
                          submission.id
                            ? "Rejecting..."
                            : "Reject"}
                        </button>
                      </div>
                    ) : submission.status === "APPROVED" ? (
                      <div
                        style={{
                          marginTop: "24px",
                          paddingTop: "20px",
                          borderTop:
                            "1px solid #e5d9e2",
                        }}
                      >
                        <div
                          style={{
                            color: "#7d6477",
                            fontSize: "13px",
                            marginBottom: "14px",
                          }}
                        >
                          Approved — ready to publish.
                        </div>

                        <button
                          type="button"
                          disabled={
                            actionLoading ===
                            submission.id
                          }
                          onClick={() =>
                            publishSubmission(
                              submission.id
                            )
                          }
                          style={{
                            border:
                              "1px solid #6f5268",
                            background: "#674f64",
                            color: "#fff",
                            padding:
                              "10px 20px",
                            cursor: "pointer",
                            fontSize: "12px",
                            letterSpacing:
                              "0.06em",
                          }}
                        >
                          {actionLoading ===
                          submission.id
                            ? "Publishing..."
                            : "Publish to archive"}
                        </button>
                      </div>
                    ) : submission.status === "PUBLISHED" ? (
                      <div
                        style={{
                          marginTop: "24px",
                          paddingTop: "20px",
                          borderTop:
                            "1px solid #e5d9e2",
                        }}
                      >
                        <div
                          style={{
                            color: "#58745f",
                            fontSize: "13px",
                            marginBottom: "14px",
                          }}
                        >
                          Published — this submission is now part of the archive.
                        </div>

                        <button
                          type="button"
                          disabled={
                            actionLoading ===
                            submission.id
                          }
                          onClick={() =>
                            setDeleteConfirmId(
                              submission.id
                            )
                          }
                          style={{
                            border:
                              "1px solid #c9aeb7",
                            background:
                              "transparent",
                            color: "#a24d5a",
                            padding:
                              "10px 18px",
                            cursor: "pointer",
                            fontSize: "12px",
                            letterSpacing:
                              "0.06em",
                          }}
                        >
                          {actionLoading ===
                          submission.id
                            ? "Deleting..."
                            : "Delete submission"}
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: "24px",
                          paddingTop: "20px",
                          borderTop:
                            "1px solid #e5d9e2",
                        }}
                      >
                        <div
                          style={{
                            color: "#a24d5a",
                            fontSize: "13px",
                            marginBottom: "14px",
                          }}
                        >
                          This submission has been rejected.
                        </div>

                        <button
                          type="button"
                          disabled={
                            actionLoading ===
                            submission.id
                          }
                          onClick={() =>
                            setDeleteConfirmId(
                              submission.id
                            )
                          }
                          style={{
                            border:
                              "1px solid #c9aeb7",
                            background:
                              "transparent",
                            color: "#a24d5a",
                            padding:
                              "10px 18px",
                            cursor: "pointer",
                            fontSize: "12px",
                            letterSpacing:
                              "0.06em",
                          }}
                        >
                          {actionLoading ===
                          submission.id
                            ? "Deleting..."
                            : "Delete submission"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}
      </main>

      {/* =================================================
          DELETE CONFIRMATION POPUP
      ================================================= */}

      {deleteConfirmId !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(62, 45, 60, 0.45)",
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
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.15)",
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
              Delete submission
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
              Are you sure you want to delete this
              submission? This cannot be undone.
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
                onClick={() =>
                  setDeleteConfirmId(null)
                }
                style={{
                  border:
                    "1px solid #e3d5df",
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
                  deleteSubmission(id);
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