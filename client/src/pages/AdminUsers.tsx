import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

type User = {
  id: number;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  created_at?: string;
};

type Analytics = {
  total_views: number;
  unique_visitors: number;
  returning_visitors: number;
  total_likes: number;
  total_comments: number;
  total_bookmarks: number;

  like_rate?: number;
  comment_rate?: number;
  save_rate?: number;
};

type AudienceAnalytics = {
  audience: {
    total_users: number;
    active_users: number;
    new_users: number;
    unique_visitors: number;
    returning_visitors: number;
    total_views: number;
    average_views_per_visitor: number;
  };

  top_content: {
    most_viewed: {
      id: number;
      title: string;
      views: number;
    } | null;

    most_liked: {
      id: number;
      title: string;
      likes: number;
    } | null;

    most_commented: {
      id: number;
      title: string;
      comments: number;
    } | null;

    most_saved: {
      id: number;
      title: string;
      bookmarks: number;
    } | null;
  };

  insights: string[];
};

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

const cardStyle = {
  background: "#fff",
  border: "1px solid #e8dfe6",
  padding: "24px",
  boxSizing: "border-box" as const,
};

export default function AdminUsers() {
  const [, setLocation] = useLocation();

  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [audienceAnalytics, setAudienceAnalytics] =
    useState<AudienceAnalytics | null>(null);

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [loadingAnalytics, setLoadingAnalytics] =
    useState(true);

  const [loadingAudience, setLoadingAudience] =
    useState(true);

  const [error, setError] = useState("");

  const [animatedRates, setAnimatedRates] =
    useState({
      like: 0,
      comment: 0,
      save: 0,
    });

  /*
   * -------------------------------------------------------
   * GET ADMIN TOKEN
   * -------------------------------------------------------
   *
   * AdminLogin stores the JWT as:
   * admin_access_token
   *
   * Use that as the primary admin token.
   */
  function getToken() {
    return localStorage.getItem("admin_access_token");
  }

  /*
   * -------------------------------------------------------
   * HANDLE AUTH FAILURE
   * -------------------------------------------------------
   */
  function handleAuthFailure() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_user");

    setLocation("/admin/login");
  }

  /*
   * -------------------------------------------------------
   * LOAD USERS + ANALYTICS
   * -------------------------------------------------------
   */
  useEffect(() => {
    const loadData = async () => {
      const token = getToken();

      if (!token) {
        setLocation("/admin/login");
        return;
      }

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      /*
       * ---------------------------------------------------
       * LOAD REGISTERED USERS
       * ---------------------------------------------------
       */
      try {
        setError("");
        setLoadingUsers(true);

        const usersResponse = await fetch(
          `${API_BASE_URL}/api/admin/users`,
          {
            method: "GET",
            headers,
          }
        );

        if (
          usersResponse.status === 401 ||
          usersResponse.status === 403
        ) {
          handleAuthFailure();
          return;
        }

        if (!usersResponse.ok) {
          throw new Error(
            "Unable to load registered users."
          );
        }

        const usersData = await usersResponse.json();

        setUsers(
          Array.isArray(usersData)
            ? usersData
            : []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load users."
        );
      } finally {
        setLoadingUsers(false);
      }

      /*
       * ---------------------------------------------------
       * LOAD ANALYTICS
       * ---------------------------------------------------
       *
       * GET /api/admin/analytics
       */
      try {
        setLoadingAnalytics(true);

        const analyticsResponse = await fetch(
          `${API_BASE_URL}/api/admin/analytics`,
          {
            method: "GET",
            headers,
          }
        );

        if (
          analyticsResponse.status === 401 ||
          analyticsResponse.status === 403
        ) {
          handleAuthFailure();
          return;
        }

        if (!analyticsResponse.ok) {
          throw new Error(
            "Unable to load audience analytics."
          );
        }

        const analyticsData =
          await analyticsResponse.json();

        setAnalytics({
          total_views:
            Number(
              analyticsData.total_views
            ) || 0,

          unique_visitors:
            Number(
              analyticsData.unique_visitors
            ) || 0,

          returning_visitors:
            Number(
              analyticsData.returning_visitors
            ) || 0,

          total_likes:
            Number(
              analyticsData.total_likes
            ) || 0,

          total_comments:
            Number(
              analyticsData.total_comments
            ) || 0,

          total_bookmarks:
            Number(
              analyticsData.total_bookmarks
            ) || 0,

          like_rate:
            Number(
              analyticsData.like_rate
            ) || 0,

          comment_rate:
            Number(
              analyticsData.comment_rate
            ) || 0,

          save_rate:
            Number(
              analyticsData.save_rate
            ) || 0,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load analytics."
        );
      } finally {
        setLoadingAnalytics(false);
      }

      /*
       * ---------------------------------------------------
       * LOAD ADVANCED AUDIENCE ANALYTICS
       * ---------------------------------------------------
       *
       * GET /api/admin/audience-analytics
       */
      try {
        setLoadingAudience(true);

        const audienceResponse = await fetch(
          `${API_BASE_URL}/api/admin/audience-analytics`,
          {
            method: "GET",
            headers,
          }
        );

        if (
          audienceResponse.status === 401 ||
          audienceResponse.status === 403
        ) {
          handleAuthFailure();
          return;
        }

        if (!audienceResponse.ok) {
          throw new Error(
            "Unable to load advanced audience analytics."
          );
        }

        const audienceData =
          await audienceResponse.json();

        setAudienceAnalytics({
          audience: {
            total_users:
              Number(
                audienceData?.audience?.total_users
              ) || 0,

            active_users:
              Number(
                audienceData?.audience?.active_users
              ) || 0,

            new_users:
              Number(
                audienceData?.audience?.new_users
              ) || 0,

            unique_visitors:
              Number(
                audienceData?.audience?.unique_visitors
              ) || 0,

            returning_visitors:
              Number(
                audienceData?.audience?.returning_visitors
              ) || 0,

            total_views:
              Number(
                audienceData?.audience?.total_views
              ) || 0,

            average_views_per_visitor:
              Number(
                audienceData?.audience
                  ?.average_views_per_visitor
              ) || 0,
          },

          top_content: {
            most_viewed:
              audienceData?.top_content?.most_viewed ??
              null,

            most_liked:
              audienceData?.top_content?.most_liked ??
              null,

            most_commented:
              audienceData?.top_content?.most_commented ??
              null,

            most_saved:
              audienceData?.top_content?.most_saved ??
              null,
          },

          insights: Array.isArray(
            audienceData?.insights
          )
            ? audienceData.insights
            : [],
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load advanced audience analytics."
        );
      } finally {
        setLoadingAudience(false);
      }
    };

    loadData();
  }, []);

  /*
   * -------------------------------------------------------
   * USER TOTALS
   * -------------------------------------------------------
   */

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.is_active
  ).length;

  const inactiveUsers =
    totalUsers - activeUsers;

  /*
   * New users = registered within
   * the last 30 days.
   */
  const newUsers = useMemo(() => {
    const thirtyDaysAgo =
      Date.now() -
      30 * 24 * 60 * 60 * 1000;

    return users.filter((user) => {
      if (!user.created_at) {
        return false;
      }

      return (
        new Date(user.created_at).getTime() >=
        thirtyDaysAgo
      );
    }).length;
  }, [users]);

  /*
   * -------------------------------------------------------
   * ANALYTICS VALUES
   * -------------------------------------------------------
   */

  const totalViews =
    analytics?.total_views || 0;

  const uniqueVisitors =
    analytics?.unique_visitors || 0;

  const returningVisitors =
    analytics?.returning_visitors || 0;

  const totalLikes =
    analytics?.total_likes || 0;

  const totalComments =
    analytics?.total_comments || 0;

  const totalBookmarks =
    analytics?.total_bookmarks || 0;

  const likeRate =
    analytics?.like_rate ?? 0;

  const commentRate =
    analytics?.comment_rate ?? 0;

  const saveRate =
    analytics?.save_rate ?? 0;

  /*
   * -------------------------------------------------------
   * ANIMATE RATES
   * -------------------------------------------------------
   */

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAnimatedRates({
        like: likeRate,
        comment: commentRate,
        save: saveRate,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [likeRate, commentRate, saveRate]);

  const advancedAudience =
    audienceAnalytics?.audience;

  const topContent =
    audienceAnalytics?.top_content;

  const audienceInsights =
    audienceAnalytics?.insights || [];

  /*
   * -------------------------------------------------------
   * LOGOUT
   * -------------------------------------------------------
   */

  function logout() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_user");

    setLocation("/admin/login");
  }

  /*
   * -------------------------------------------------------
   * LOADING
   * -------------------------------------------------------
   */

  if (loadingUsers && loadingAnalytics) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#faf7fa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#806b7b",
          fontFamily:
            '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
      >
        Loading audience analytics...
      </div>
    );
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
        background: "#faf7fa",
        color: "#342b35",
        fontFamily:
          '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        style={{
          width: "240px",
          minHeight: "100vh",
          background: "#fff",
          borderRight:
            "1px solid #e8dfe6",
          padding: "34px 24px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#8b7187",
            }}
          >
            UNFILTERED ARCHIVES
          </div>

          <div
            style={{
              marginTop: "8px",
              marginBottom: "30px",
              fontFamily: "Georgia, serif",
              fontSize: "24px",
              fontWeight: 500,
              color: "#342b35",
            }}
          >
            ADMIN
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setLocation("/admin")
            }
            style={navButtonStyle}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              setLocation("/admin/writings")
            }
            style={navButtonStyle}
          >
            Writings
          </button>

          <button
            type="button"
            onClick={() =>
              setLocation("/admin/community")
            }
            style={navButtonStyle}
          >
            Community
          </button>

          <button
            type="button"
            onClick={() =>
              setLocation("/admin/comments")
            }
            style={navButtonStyle}
          >
            Comments
          </button>

          <button
            type="button"
            style={{
              ...navButtonStyle,
              background: "#f1e9f0",
              color: "#674f64",
              cursor: "default",
            }}
          >
            Users
          </button>

          <button
            type="button"
            onClick={() =>
              setLocation("/admin/reports")
            }
            style={navButtonStyle}
          >
            Reports
          </button>
        </nav>

        <button
          type="button"
          onClick={logout}
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
          Log out
        </button>
      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main
        style={{
          flex: 1,
          padding: "46px 52px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
          }}
        >
          {/* HEADER */}

          <div
            style={{
              marginBottom: "38px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#8b7187",
                marginBottom: "8px",
              }}
            >
              AUDIENCE
            </div>

            <h1
              style={{
                margin: 0,
                fontFamily: "Georgia, serif",
                fontSize: "36px",
                fontWeight: 400,
                color: "#342b35",
              }}
            >
              Users
            </h1>

            <p
              style={{
                margin: "10px 0 0",
                fontSize: "14px",
                color: "#817480",
                lineHeight: 1.7,
              }}
            >
              Understand your readers,
              audience growth and
              engagement.
            </p>
          </div>

          {/* ERROR */}

          {error && (
            <div
              style={{
                marginBottom: "24px",
                padding: "14px 16px",
                background: "#fbefef",
                border:
                  "1px solid #ead4d8",
                color: "#9b5263",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {/* =================================================
              USER OVERVIEW
          ================================================= */}

          <section
            style={{
              marginBottom: "42px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8b7187",
                marginBottom: "14px",
              }}
            >
              USER OVERVIEW
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
              }}
            >
              <StatCard
                label="Total users"
                value={totalUsers}
                loading={loadingUsers}
              />

              <StatCard
                label="Active users"
                value={activeUsers}
                loading={loadingUsers}
              />

              <StatCard
                label="New users · 30 days"
                value={newUsers}
                loading={loadingUsers}
              />

              <StatCard
                label="Inactive users"
                value={inactiveUsers}
                loading={loadingUsers}
              />
            </div>
          </section>

          {/* =================================================
              AUDIENCE
          ================================================= */}

          <section
            style={{
              marginBottom: "42px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8b7187",
                marginBottom: "14px",
              }}
            >
              AUDIENCE
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
              }}
            >
              <StatCard
                label="Total views"
                value={totalViews}
                loading={loadingAnalytics}
              />

              <StatCard
                label="Unique visitors"
                value={uniqueVisitors}
                loading={loadingAnalytics}
              />

              <StatCard
                label="Returning visitors"
                value={returningVisitors}
                loading={loadingAnalytics}
              />
            </div>
          </section>

          {/* =================================================
              ENGAGEMENT
          ================================================= */}

          <section
            style={{
              marginBottom: "42px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8b7187",
                marginBottom: "14px",
              }}
            >
              ENGAGEMENT
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
              }}
            >
              <StatCard
                label="Likes"
                value={totalLikes}
                loading={loadingAnalytics}
              />

              <StatCard
                label="Comments"
                value={totalComments}
                loading={loadingAnalytics}
              />

              <StatCard
                label="Bookmarks"
                value={totalBookmarks}
                loading={loadingAnalytics}
              />
            </div>
          </section>

          {/* =================================================
              ENGAGEMENT RATES
          ================================================= */}

          <section
            style={{
              marginBottom: "42px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8b7187",
                marginBottom: "14px",
              }}
            >
              ENGAGEMENT RATES
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
              }}
            >
              <AnimatedRateCard
                label="Like rate"
                value={animatedRates.like}
              />

              <AnimatedRateCard
                label="Comment rate"
                value={animatedRates.comment}
              />

              <AnimatedRateCard
                label="Save rate"
                value={animatedRates.save}
              />
            </div>
          </section>

          {/* =================================================
              CONTENT PERFORMANCE
          ================================================= */}

          <section
            style={{
              marginBottom: "42px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8b7187",
                marginBottom: "14px",
              }}
            >
              CONTENT PERFORMANCE
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              <ContentInsightCard
                label="Most viewed"
                title={
                  topContent?.most_viewed?.title ||
                  "No tracked views yet"
                }
                value={
                  topContent?.most_viewed
                    ? `${topContent.most_viewed.views.toLocaleString()} views`
                    : "—"
                }
                loading={loadingAudience}
              />

              <ContentInsightCard
                label="Most liked"
                title={
                  topContent?.most_liked?.title ||
                  "No likes yet"
                }
                value={
                  topContent?.most_liked
                    ? `${topContent.most_liked.likes.toLocaleString()} likes`
                    : "—"
                }
                loading={loadingAudience}
              />

              <ContentInsightCard
                label="Most commented"
                title={
                  topContent?.most_commented?.title ||
                  "No comments yet"
                }
                value={
                  topContent?.most_commented
                    ? `${topContent.most_commented.comments.toLocaleString()} comments`
                    : "—"
                }
                loading={loadingAudience}
              />

              <ContentInsightCard
                label="Most saved"
                title={
                  topContent?.most_saved?.title ||
                  "No bookmarks yet"
                }
                value={
                  topContent?.most_saved
                    ? `${topContent.most_saved.bookmarks.toLocaleString()} saves`
                    : "—"
                }
                loading={loadingAudience}
              />
            </div>
          </section>

          {/* =================================================
              AUDIENCE INSIGHTS
          ================================================= */}

          <section
            style={{
              marginBottom: "42px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8b7187",
                marginBottom: "14px",
              }}
            >
              AUDIENCE INSIGHTS
            </div>

            <div style={cardStyle}>
              {loadingAudience ? (
                <div
                  style={{
                    color: "#817480",
                    fontSize: "13px",
                  }}
                >
                  Analysing audience...
                </div>
              ) : audienceInsights.length === 0 ? (
                <div
                  style={{
                    color: "#817480",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  More audience activity is needed to generate
                  content insights.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  {audienceInsights.map(
                    (insight, index) => (
                      <div
                        key={`${index}-${insight}`}
                        style={{
                          padding: "14px 16px",
                          background: "#faf7fa",
                          border:
                            "1px solid #eee7ec",
                          color: "#6f626c",
                          fontSize: "13px",
                          lineHeight: 1.6,
                        }}
                      >
                        {insight}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              AUDIENCE DETAILS
          ================================================= */}

          <section
            style={{
              marginBottom: "42px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8b7187",
                marginBottom: "14px",
              }}
            >
              AUDIENCE DETAILS
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
              }}
            >
              <StatCard
                label="New users · 30 days"
                value={
                  advancedAudience?.new_users || 0
                }
                loading={loadingAudience}
              />

              <StatCard
                label="Returning visitors"
                value={
                  advancedAudience?.returning_visitors || 0
                }
                loading={loadingAudience}
              />

              <StatCard
                label="Average views / visitor"
                value={
                  advancedAudience?.average_views_per_visitor || 0
                }
                loading={loadingAudience}
              />
            </div>
          </section>

          {/* =================================================
              REGISTERED USERS
          ================================================= */}

          <section>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "20px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#8b7187",
                }}
              >
                REGISTERED USERS
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#9a8b96",
                }}
              >
                {totalUsers.toLocaleString()} total
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e8dfe6",
                overflowX: "auto",
              }}
            >
              {loadingUsers ? (
                <div
                  style={{
                    padding: "30px",
                    color: "#817480",
                    fontSize: "13px",
                  }}
                >
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div
                  style={{
                    padding: "30px",
                    color: "#817480",
                    fontSize: "13px",
                  }}
                >
                  No registered users found.
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "680px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>
                        USER
                      </th>

                      <th style={tableHeaderStyle}>
                        EMAIL
                      </th>

                      <th style={tableHeaderStyle}>
                        ROLE
                      </th>

                      <th style={tableHeaderStyle}>
                        STATUS
                      </th>

                      <th style={tableHeaderStyle}>
                        JOINED
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td style={tableCellStyle}>
                          <div
                            style={{
                              fontWeight: 500,
                              color: "#342b35",
                            }}
                          >
                            {user.display_name}
                          </div>

                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "11px",
                              color: "#9a8b96",
                            }}
                          >
                            User #{user.id}
                          </div>
                        </td>

                        <td style={tableCellStyle}>
                          {user.email}
                        </td>

                        <td style={tableCellStyle}>
                          {user.role}
                        </td>

                        <td style={tableCellStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "5px 9px",
                              fontSize: "11px",
                              background: user.is_active
                                ? "#edf4ef"
                                : "#f4eeee",
                              color: user.is_active
                                ? "#52715d"
                                : "#8c6262",
                            }}
                          >
                            {user.is_active
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>
                        </td>

                        <td style={tableCellStyle}>
                          {user.created_at
                            ? new Date(
                                user.created_at
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div style={cardStyle}>
      <p
        style={{
          margin: 0,
          fontSize: "11px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#8b7187",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: "14px 0 0",
          fontSize: "32px",
          fontWeight: 400,
          color: "#342b35",
        }}
      >
        {loading
          ? "—"
          : value.toLocaleString()}
      </p>
    </div>
  );
}

/* =========================================================
   CONTENT INSIGHT CARD
========================================================= */

function ContentInsightCard({
  label,
  title,
  value,
  loading,
}: {
  label: string;
  title: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        minHeight: "150px",
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
        {label}
      </p>

      <p
        style={{
          margin: "14px 0 0",
          fontFamily: "Georgia, serif",
          fontSize: "19px",
          fontWeight: 400,
          lineHeight: 1.4,
          color: "#342b35",
        }}
      >
        {loading ? "—" : title}
      </p>

      <p
        style={{
          margin: "10px 0 0",
          fontSize: "12px",
          color: "#9a8b96",
        }}
      >
        {loading ? "—" : value}
      </p>
    </div>
  );
}

/* =========================================================
   ANIMATED RATE CARD
========================================================= */

function AnimatedRateCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  const safeValue = Math.max(
    0,
    Math.min(100, value)
  );

  const offset =
    circumference -
    (safeValue / 100) * circumference;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8dfe6",
        minHeight: "210px",
        padding: "24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "126px",
          height: "126px",
        }}
      >
        <svg
          width="126"
          height="126"
          viewBox="0 0 126 126"
          style={{
            transform: "rotate(-90deg)",
            overflow: "visible",
          }}
        >
          <circle
            cx="63"
            cy="63"
            r={radius}
            fill="none"
            stroke="#eee6ed"
            strokeWidth="8"
          />

          <circle
            cx="63"
            cy="63"
            r={radius}
            fill="none"
            stroke="#674f64"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition:
                "stroke-dashoffset 1.2s ease-out",
            }}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "27px",
              color: "#342b35",
              lineHeight: 1,
            }}
          >
            {safeValue.toFixed(0)}%
          </span>
        </div>
      </div>

      <p
        style={{
          margin: "18px 0 0",
          fontSize: "11px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#8b7187",
        }}
      >
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   TABLE STYLES
========================================================= */

const tableHeaderStyle = {
  padding: "14px 18px",
  textAlign: "left" as const,
  fontSize: "10px",
  letterSpacing: "0.1em",
  fontWeight: 500,
  color: "#8b7187",
  background: "#faf7fa",
  borderBottom: "1px solid #e8dfe6",
};

const tableCellStyle = {
  padding: "16px 18px",
  textAlign: "left" as const,
  fontSize: "13px",
  color: "#6f626c",
  borderBottom: "1px solid #eee7ec",
};