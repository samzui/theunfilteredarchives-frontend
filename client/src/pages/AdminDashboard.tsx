import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

type AdminStats = {
  total_writings?: number;
  published_writings?: number;
  draft_writings?: number;
  total_views?: number;
  total_comments?: number;
  total_likes?: number;
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("admin_access_token");

      if (!token) {
        setLocation("/admin/login");
        return;
      }

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/stats`,
          {
            method: "GET",
            headers,
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token");
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_user");

          setLocation("/admin/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load dashboard statistics.");
        }

        const data = await response.json();

        const totalWritings =
          Number(data.total_writings ?? data.writings) || 0;

        const publishedWritings =
          Number(data.published_writings ?? data.published) || 0;

        const draftWritings =
          data.draft_writings !== undefined
            ? Number(data.draft_writings) || 0
            : Math.max(
                totalWritings - publishedWritings,
                0
              );

        const totalViews =
          Number(data.total_views ?? data.views) || 0;

        const totalComments =
          Number(data.total_comments ?? data.comments) || 0;

        let totalLikes =
          Number(data.total_likes ?? data.likes) || 0;

        // Fetch likes separately if /stats does not provide them.
        try {
          const analyticsResponse = await fetch(
            `${API_BASE_URL}/api/admin/analytics`,
            {
              method: "GET",
              headers,
            }
          );

          if (analyticsResponse.ok) {
            const analyticsData =
              await analyticsResponse.json();

            totalLikes =
              Number(
                analyticsData.total_likes
              ) || totalLikes;
          }
        } catch {
          // Keep the likes value from /stats.
        }

        setStats({
          total_writings: totalWritings,
          published_writings: publishedWritings,
          draft_writings: draftWritings,
          total_views: totalViews,
          total_comments: totalComments,
          total_likes: totalLikes,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [setLocation]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");

    setLocation("/admin/login");
  }

  const statCards = [
    {
      label: "Total Writings",
      value: stats?.total_writings ?? 0,
    },
    {
      label: "Published",
      value: stats?.published_writings ?? 0,
    },
    {
      label: "Drafts",
      value: stats?.draft_writings ?? 0,
    },
    {
      label: "Total Views",
      value: stats?.total_views ?? 0,
    },
    {
      label: "Comments",
      value: stats?.total_comments ?? 0,
    },
    {
      label: "Likes",
      value: stats?.total_likes ?? 0,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f8f3f7",
        color: "#342b35",
      }}
    >
      {/* Sidebar */}
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

          {/* Comments */}
          <button
            type="button"
            onClick={() => setLocation("/admin/comments")}
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

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: "48px",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <header style={{ marginBottom: "40px" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#8b7187",
            }}
          >
            Overview
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: "38px",
              fontWeight: 400,
              letterSpacing: "-0.03em",
            }}
          >
            Welcome back.
          </h2>
        </header>

        {loading && (
          <p
            style={{
              fontSize: "14px",
              color: "#817480",
            }}
          >
            Loading your archive...
          </p>
        )}

        {error && (
          <div
            style={{
              padding: "14px 16px",
              marginBottom: "24px",
              background: "#fbefef",
              color: "#a24d5a",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Statistics */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                marginBottom: "42px",
              }}
            >
              {statCards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: "#fff",
                    border: "1px solid #e8dfe6",
                    padding: "24px",
                    minHeight: "110px",
                    boxSizing: "border-box",
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
                    {card.label}
                  </p>

                  <p
                    style={{
                      margin: "14px 0 0",
                      fontSize: "32px",
                      fontWeight: 400,
                      color: "#342b35",
                    }}
                  >
                    {card.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </section>

            {/* Start writing */}
            <section
              style={{
                background: "#fff",
                border: "1px solid #e8dfe6",
                padding: "28px",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#8b7187",
                }}
              >
                Next
              </p>

              <h3
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 400,
                }}
              >
                Start writing
              </h3>

              <p
                style={{
                  margin: "10px 0 20px",
                  maxWidth: "520px",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "#817480",
                }}
              >
                Create, edit and publish your writings directly from
                the admin area.
              </p>

              <button
                type="button"
                onClick={() => setLocation("/admin/writings")}
                style={{
                  border: "none",
                  padding: "12px 18px",
                  background: "#594454",
                  color: "#fff",
                  borderRadius: "2px",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Manage writings
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}