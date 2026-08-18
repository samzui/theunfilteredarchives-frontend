import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

type CommentItem = {
  id: number;
  content: string;
  status: string;
  author_id: number;
  writing_id: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
};

export default function AdminComments() {
  const [, setLocation] = useLocation();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadComments() {
    const token =
      localStorage.getItem("admin_access_token");

    if (!token) {
      setLocation("/admin/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/comments`,
        {
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
        localStorage.removeItem(
          "admin_access_token"
        );
        localStorage.removeItem("admin_user");
        setLocation("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to load comments."
        );
      }

      const data = await response.json();

      setComments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load comments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, []);

  async function moderateComment(
    commentId: number,
    status: "VISIBLE" | "HIDDEN" | "REMOVED"
  ) {
    const token =
      localStorage.getItem("admin_access_token");

    if (!token) {
      setLocation("/admin/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/comments/${commentId}/moderate`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "admin_access_token"
        );
        localStorage.removeItem("admin_user");
        setLocation("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to update comment."
        );
      }

      await loadComments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update comment."
      );
    }
  }

  function handleLogout() {
    localStorage.removeItem(
      "admin_access_token"
    );
    localStorage.removeItem("admin_user");
    setLocation("/admin/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f8f3f7",
        color: "#342b35",
      }}
    >
      {/* SIDEBAR */}

      <aside
        style={{
          width: "240px",
          minHeight: "100vh",
          boxSizing: "border-box",
          padding: "34px 24px",
          background: "#fff",
          borderRight:
            "1px solid #e8dfe6",
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
  UNFILTERED ARCHIVES
</p>

<h1
  style={{
    margin: "8px 0 30px",
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 500,
  }}
>
  ADMIN
</h1>
<nav
  style={{
    marginTop: "48px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
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
    onClick={() => setLocation("/admin/writings")}
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
    onClick={() => setLocation("/admin/community")}
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
    Community
  </button>

  {/* Comments - ACTIVE */}
  <button
    type="button"
    style={{
      textAlign: "left",
      border: "none",
      background: "#f1e9f0",
      color: "#674f64",
      padding: "12px 14px",
      borderRadius: "2px",
      cursor: "default",
      fontSize: "13px",
    }}
  >
    Comments
  </button>

  {/* Users */}
  <button
    type="button"
    onClick={() => setLocation("/admin/users")}
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
    onClick={() => setLocation("/admin/reports")}
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
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            textAlign: "left",
            border: "none",
            background: "transparent",
            color: "#8b7187",
            padding: "12px 14px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}

      <main
        style={{
          flex: 1,
          padding:
            "46px 52px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform:
                "uppercase",
              color: "#8b7187",
            }}
          >
            MODERATION
          </p>

          <h2
            style={{
              margin:
                "8px 0 10px",
              fontFamily:
                "Georgia, serif",
              fontWeight: 500,
              fontSize: "34px",
            }}
          >
            Comments
          </h2>

          <p
            style={{
              margin:
                "0 0 32px",
              color: "#7d707a",
              fontSize: "14px",
            }}
          >
            Review and moderate
            comments from your
            readers.
          </p>

          {error && (
            <div
              style={{
                padding: "14px 16px",
                marginBottom: "20px",
                background: "#f8e9ed",
                color: "#8b4657",
                border:
                  "1px solid #ead0d8",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <p
              style={{
                color: "#8b7187",
              }}
            >
              Loading comments...
            </p>
          ) : comments.length ===
            0 ? (
            <div
              style={{
                background: "#fff",
                border:
                  "1px solid #e8dfe6",
                padding: "40px",
                textAlign: "center",
                color: "#8b7187",
              }}
            >
              No comments found.
            </div>
          ) : (
            <div
              style={{
                background: "#fff",
                border:
                  "1px solid #e8dfe6",
              }}
            >
              {comments.map(
                (comment, index) => (
                  <div
                    key={comment.id}
                    style={{
                      padding:
                        "24px 28px",
                      borderBottom:
                        index ===
                        comments.length -
                          1
                          ? "none"
                          : "1px solid #eee5eb",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: "20px",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "12px",
                            marginBottom:
                              "10px",
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#8b7187",
                            }}
                          >
                            Comment #
                            {
                              comment.id
                            }
                          </span>

                          <span
                            style={{
                              fontSize:
                                "11px",
                              padding:
                                "4px 8px",
                              background:
                                "#f3edf2",
                              color:
                                "#674f64",
                            }}
                          >
                            {
                              comment.status
                            }
                          </span>
                        </div>

                        <p
                          style={{
                            margin:
                              "0 0 14px",
                            fontFamily:
                              "Georgia, serif",
                            fontSize:
                              "17px",
                            lineHeight:
                              1.6,
                            color:
                              "#3e343d",
                          }}
                        >
                          {comment.content}
                        </p>

                        <div
                          style={{
                            display:
                              "flex",
                            gap: "18px",
                            fontSize:
                              "12px",
                            color:
                              "#9a8b96",
                          }}
                        >
                          <span>
                            User #
                            {
                              comment.author_id
                            }
                          </span>

                          <span>
                            Writing #
                            {
                              comment.writing_id
                            }
                          </span>

                          <span>
                            {new Date(
                              comment.created_at
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "8px",
                          flexShrink: 0,
                        }}
                      >
                        {comment.status !==
                          "VISIBLE" && (
                          <button
                            type="button"
                            onClick={() =>
                              moderateComment(
                                comment.id,
                                "VISIBLE"
                              )
                            }
                            style={
                              actionButtonStyle
                            }
                          >
                            Restore
                          </button>
                        )}

                        {comment.status ===
                          "VISIBLE" && (
                          <button
                            type="button"
                            onClick={() =>
                              moderateComment(
                                comment.id,
                                "HIDDEN"
                              )
                            }
                            style={
                              actionButtonStyle
                            }
                          >
                            Hide
                          </button>
                        )}

                        {comment.status !==
                          "REMOVED" && (
                          <button
                            type="button"
                            onClick={() =>
                              moderateComment(
                                comment.id,
                                "REMOVED"
                              )
                            }
                            style={{
                              ...actionButtonStyle,
                              color:
                                "#9b5263",
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


const navButtonStyle = {
  textAlign: "left" as const,
  border: "none",
  background: "transparent",
  color: "#6f626c",
  padding: "12px 14px",
  borderRadius: "2px",
  cursor: "pointer",
  fontSize: "13px",
};


const actionButtonStyle = {
  border: "1px solid #d9c9d5",
  background: "#fff",
  color: "#674f64",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "12px",
};