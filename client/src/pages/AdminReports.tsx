import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

type WritingReport = {
  writing_id: number;
  title: string;

  views: number;
  unique_viewers: number;

  likes: number;
  unique_likers: number;

  comments: number;
  unique_commenters: number;

  bookmarks: number;
  unique_savers: number;

  like_rate: number;
  comment_rate: number;
  save_rate: number;

  engagement_rate: number;
  performance: "HIGH" | "MEDIUM" | "LOW" | string;
};

type WritingReportsResponse = {
  total_published_writings: number;
  reports: WritingReport[];
};

type AIAnalysis = {
  writing_style: string;
  audience_response: string;
  what_works: string;
  recommendation: string;
};

type AIAnalysisResponse = {
  writing_id: number;
  title: string;
  metrics: {
    views: number;
    unique_viewers: number;
    likes: number;
    unique_likers: number;
    comments: number;
    unique_commenters: number;
    saves: number;
    unique_savers: number;
    like_rate: number;
    comment_rate: number;
    save_rate: number;
    engagement_rate: number;
    performance: string;
  };
  analysis: AIAnalysis;
  source: "ai" | "fallback" | string;
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

const metricLabelStyle = {
  fontSize: "10px",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "#9a8794",
  marginBottom: "5px",
};

const metricValueStyle = {
  fontSize: "20px",
  fontWeight: 400,
  color: "#342b35",
};

export default function AdminReports() {
  const [, setLocation] = useLocation();

  const [reports, setReports] = useState<WritingReport[]>([]);
  const [totalPublished, setTotalPublished] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [aiResults, setAiResults] = useState<
    Record<number, AIAnalysisResponse>
  >({});

  const [aiLoading, setAiLoading] = useState<
    Record<number, boolean>
  >({});

  const [aiErrors, setAiErrors] = useState<
    Record<number, string>
  >({});

  function getToken() {
  return (
    localStorage.getItem("admin_access_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

  function handleAuthFailure() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");

    setLocation("/admin/login");
  }

  async function loadWritingReports() {
    const token = getToken();

    if (!token) {
      setLocation("/admin/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/writing-reports`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message ||
            "Failed to load writing performance reports."
        );
      }

      const data: WritingReportsResponse =
        await response.json();

      setReports(
        Array.isArray(data.reports)
          ? data.reports
          : []
      );

      setTotalPublished(
        typeof data.total_published_writings === "number"
          ? data.total_published_writings
          : 0
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load writing performance reports."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWritingReports();
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");

    setLocation("/admin/login");
  }

  function performanceStyle(performance: string) {
    const normalized = performance.toUpperCase();

    if (normalized === "HIGH") {
      return {
        background: "#edf4ef",
        color: "#52715d",
      };
    }

    if (normalized === "MEDIUM") {
      return {
        background: "#f5f0e8",
        color: "#8a704d",
      };
    }

    return {
      background: "#f1eef2",
      color: "#776979",
    };
  }

  function formatRate(value: number) {
    return `${Number(value || 0).toFixed(2)}%`;
  }

  async function analyzeWithAI(writingId: number) {
    const token = getToken();

    if (!token) {
      setLocation("/admin/login");
      return;
    }

    try {
      setAiLoading((current) => ({
        ...current,
        [writingId]: true,
      }));

      setAiErrors((current) => ({
        ...current,
        [writingId]: "",
      }));

      const response = await fetch(
        `${API_BASE_URL}/api/admin/writing-reports/${writingId}/ai-analysis`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message ||
            "Unable to generate writing analysis."
        );
      }

      const data: AIAnalysisResponse =
        await response.json();

      setAiResults((current) => ({
        ...current,
        [writingId]: data,
      }));
    } catch (err) {
      setAiErrors((current) => ({
        ...current,
        [writingId]:
          err instanceof Error
            ? err.message
            : "Unable to generate analysis.",
      }));
    } finally {
      setAiLoading((current) => ({
        ...current,
        [writingId]: false,
      }));
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f8f3f7",
        color: "#342b35",
        fontFamily:
          '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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

  {/* Reports - ACTIVE */}
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

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

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
            Performance Analytics
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: "38px",
              fontWeight: 400,
              letterSpacing: "-0.03em",
            }}
          >
            Writing Performance
          </h2>

          <p
            style={{
              margin: "10px 0 0",
              maxWidth: "620px",
              fontSize: "14px",
              lineHeight: 1.7,
              color: "#817480",
            }}
          >
            See how each published writing is performing based on
            views, audience interaction, and engagement.
          </p>
        </header>

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        {!loading && !error && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e8dfe6",
                padding: "22px",
              }}
            >
              <div style={metricLabelStyle}>
                Published writings
              </div>

              <div style={metricValueStyle}>
                {totalPublished}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e8dfe6",
                padding: "22px",
              }}
            >
              <div style={metricLabelStyle}>
                Reports generated
              </div>

              <div style={metricValueStyle}>
                {reports.length}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e8dfe6",
                padding: "22px",
              }}
            >
              <div style={metricLabelStyle}>
                High performance
              </div>

              <div style={metricValueStyle}>
                {
                  reports.filter(
                    (report) =>
                      report.performance?.toUpperCase() ===
                      "HIGH"
                  ).length
                }
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            style={{
              padding: "14px 16px",
              marginBottom: "24px",
              background: "#fbefef",
              color: "#a24d5a",
              fontSize: "13px",
              border: "1px solid #ead6da",
            }}
          >
            {error}
          </div>
        )}

        {/* =====================================================
            REPORTS
        ===================================================== */}

        {loading ? (
          <section
            style={{
              background: "#fff",
              border: "1px solid #e8dfe6",
              padding: "40px 30px",
              fontSize: "14px",
              color: "#817480",
            }}
          >
            Loading writing performance...
          </section>
        ) : reports.length === 0 ? (
          <section
            style={{
              background: "#fff",
              border: "1px solid #e8dfe6",
              padding: "40px 30px",
              fontSize: "14px",
              color: "#817480",
            }}
          >
            No published writings found.
          </section>
        ) : (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {reports.map((report) => {
              const performance =
                report.performance?.toUpperCase() || "LOW";

              const aiResult =
                aiResults[report.writing_id];

              const isAILoading =
                Boolean(aiLoading[report.writing_id]);

              const aiError =
                aiErrors[report.writing_id];

              return (
                <article
                  key={report.writing_id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e8dfe6",
                    padding: "28px",
                  }}
                >
                  {/* Writing title + performance */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "20px",
                      marginBottom: "26px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 7px",
                          fontSize: "10px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "#9a8794",
                        }}
                      >
                        Writing #{report.writing_id}
                      </p>

                      <h3
                        style={{
                          margin: 0,
                          fontSize: "22px",
                          fontWeight: 400,
                          color: "#342b35",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {report.title}
                      </h3>
                    </div>

                    <span
                      style={{
                        display: "inline-block",
                        flexShrink: 0,
                        padding: "7px 11px",
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        fontWeight: 500,
                        ...performanceStyle(performance),
                      }}
                    >
                      {performance} PERFORMANCE
                    </span>
                  </div>

                  {/* =================================================
                      PRIMARY METRICS
                  ================================================= */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(4, minmax(120px, 1fr))",
                      gap: "12px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        padding: "18px",
                        background: "#faf7fa",
                        border: "1px solid #eee7ec",
                      }}
                    >
                      <div style={metricLabelStyle}>
                        Views
                      </div>

                      <div style={metricValueStyle}>
                        {report.views}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "18px",
                        background: "#faf7fa",
                        border: "1px solid #eee7ec",
                      }}
                    >
                      <div style={metricLabelStyle}>
                        Likes
                      </div>

                      <div style={metricValueStyle}>
                        {report.likes}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "18px",
                        background: "#faf7fa",
                        border: "1px solid #eee7ec",
                      }}
                    >
                      <div style={metricLabelStyle}>
                        Comments
                      </div>

                      <div style={metricValueStyle}>
                        {report.comments}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "18px",
                        background: "#faf7fa",
                        border: "1px solid #eee7ec",
                      }}
                    >
                      <div style={metricLabelStyle}>
                        Saves
                      </div>

                      <div style={metricValueStyle}>
                        {report.bookmarks}
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      UNIQUE AUDIENCE
                  ================================================= */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(3, minmax(140px, 1fr))",
                      gap: "12px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 18px",
                        borderTop: "1px solid #eee7ec",
                      }}
                    >
                      <div style={metricLabelStyle}>
                        Unique viewers
                      </div>

                      <div style={metricValueStyle}>
                        {report.unique_viewers}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "16px 18px",
                        borderTop: "1px solid #eee7ec",
                      }}
                    >
                      <div style={metricLabelStyle}>
                        Unique likers
                      </div>

                      <div style={metricValueStyle}>
                        {report.unique_likers}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "16px 18px",
                        borderTop: "1px solid #eee7ec",
                      }}
                    >
                      <div style={metricLabelStyle}>
                        Unique commenters
                      </div>

                      <div style={metricValueStyle}>
                        {report.unique_commenters}
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      RATES
                  ================================================= */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(4, minmax(120px, 1fr))",
                      gap: "12px",
                      paddingTop: "22px",
                      borderTop: "1px solid #e8dfe6",
                    }}
                  >
                    <div>
                      <div style={metricLabelStyle}>
                        Like rate
                      </div>

                      <div
                        style={{
                          fontSize: "18px",
                          color: "#594454",
                        }}
                      >
                        {formatRate(report.like_rate)}
                      </div>
                    </div>

                    <div>
                      <div style={metricLabelStyle}>
                        Comment rate
                      </div>

                      <div
                        style={{
                          fontSize: "18px",
                          color: "#594454",
                        }}
                      >
                        {formatRate(report.comment_rate)}
                      </div>
                    </div>

                    <div>
                      <div style={metricLabelStyle}>
                        Save rate
                      </div>

                      <div
                        style={{
                          fontSize: "18px",
                          color: "#594454",
                        }}
                      >
                        {formatRate(report.save_rate)}
                      </div>
                    </div>

                    <div>
                      <div style={metricLabelStyle}>
                        Engagement
                      </div>

                      <div
                        style={{
                          fontSize: "18px",
                          color: "#594454",
                        }}
                      >
                        {formatRate(report.engagement_rate)}
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      AI ANALYSIS
                  ================================================= */}

                  <div
                    style={{
                      marginTop: "24px",
                      padding: "20px",
                      background: "#faf7fa",
                      border: "1px solid #e5dbe3",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "15px",
                        marginBottom: aiResult ? "20px" : "0",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "10px",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "#8b7187",
                            marginBottom: "6px",
                          }}
                        >
                          AI Performance Analysis
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            color: "#817480",
                          }}
                        >
                          Get an analysis of this writing's
                          audience response and performance.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          analyzeWithAI(report.writing_id)
                        }
                        disabled={isAILoading}
                        style={{
                          flexShrink: 0,
                          border: "none",
                          background: isAILoading
                            ? "#c9bdc7"
                            : "#674f64",
                          color: "#fff",
                          padding: "11px 17px",
                          borderRadius: "3px",
                          cursor: isAILoading
                            ? "default"
                            : "pointer",
                          fontSize: "12px",
                        }}
                      >
                        {isAILoading
                          ? "Analyzing..."
                          : aiResult
                            ? "Analyze Again"
                            : " Analyze Writing"}
                      </button>
                    </div>

                    {/* AI ERROR */}

                    {aiError && (
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "12px 14px",
                          background: "#fbefef",
                          border: "1px solid #ead6da",
                          color: "#a24d5a",
                          fontSize: "12px",
                        }}
                      >
                        {aiError}
                      </div>
                    )}

                    {/* AI RESULT */}

                    {aiResult && (
                      <div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(2, minmax(0, 1fr))",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              padding: "16px",
                              background: "#fff",
                              border:
                                "1px solid #eee7ec",
                            }}
                          >
                            <div
                              style={metricLabelStyle}
                            >
                              Writing style
                            </div>

                            <div
                              style={{
                                fontSize: "13px",
                                lineHeight: 1.7,
                                color: "#594454",
                              }}
                            >
                              {
                                aiResult.analysis
                                  .writing_style
                              }
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "16px",
                              background: "#fff",
                              border:
                                "1px solid #eee7ec",
                            }}
                          >
                            <div
                              style={metricLabelStyle}
                            >
                              Audience response
                            </div>

                            <div
                              style={{
                                fontSize: "13px",
                                lineHeight: 1.7,
                                color: "#594454",
                              }}
                            >
                              {
                                aiResult.analysis
                                  .audience_response
                              }
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "16px",
                              background: "#fff",
                              border:
                                "1px solid #eee7ec",
                            }}
                          >
                            <div
                              style={metricLabelStyle}
                            >
                              What works
                            </div>

                            <div
                              style={{
                                fontSize: "13px",
                                lineHeight: 1.7,
                                color: "#594454",
                              }}
                            >
                              {
                                aiResult.analysis
                                  .what_works
                              }
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "16px",
                              background: "#fff",
                              border:
                                "1px solid #eee7ec",
                            }}
                          >
                            <div
                              style={metricLabelStyle}
                            >
                              Recommendation
                            </div>

                            <div
                              style={{
                                fontSize: "13px",
                                lineHeight: 1.7,
                                color: "#594454",
                              }}
                            >
                              {
                                aiResult.analysis
                                  .recommendation
                              }
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: "14px",
                            fontSize: "10px",
                            color: "#9a8794",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          Analysis source:{" "}
                          {aiResult.source === "ai"
                            ? "AI"
                            : "Analytics fallback"}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}