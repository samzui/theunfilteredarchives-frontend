// Paper House style: asymmetrical editorial composition,
// cream reading canvas, dusty mauve atmosphere,
// deep plum ink, and fine journal-like rules.

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Instagram, Menu, X } from "lucide-react";


const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

const HERO_IMAGE = "/images/hero.png";
const PAPER_IMAGE =
  "/manus-storage/quietly-written-paper_9cca984b.jpg";
const WINDOW_IMAGE =
  "/manus-storage/quietly-written-window_edfa36fe.jpg";
const INK_IMAGE =
  "/manus-storage/quietly-written-ink_dbd1aa41.jpg";
const MARK_IMAGE = "/images/about-logo.png";
const ABOUT_LOGO_IMAGE = "/images/about-logo.png";



const categories = [
  "Latest notes",
  "Most read",
  "Community",
  "About the archive",
];

/* -------------------------------------------------------
   TYPES
------------------------------------------------------- */

type Writing = {
  id: number;
  title: string;
  content: string;

  excerpt?: string | null;

  cover_image_url?: string | null;

  category_id?: number | null;

  category?: {
    id: number;
    name: string;
  } | null;

  tags?: {
    id: number;
    name: string;
  }[];

  status?: string | null;

  featured?: boolean;

  published_at?: string | null;

  created_at?: string | null;

  updated_at?: string | null;

  view_count?: number;
};

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function formatDate(
  dateString?: string | null
) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const year = String(
    date.getFullYear()
  ).slice(-2);

  return `${day}.${month}.${year}`;
}

function getReadTime(
  content?: string
) {
  if (!content) {
    return "1 min read";
  }

  const plainText =
    content.replace(
      /<[^>]*>/g,
      " "
    );

  const words =
    plainText
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const minutes = Math.max(
    1,
    Math.ceil(words / 200)
  );

  return `${minutes} min read`;
}

/* -------------------------------------------------------
   MAIN
------------------------------------------------------- */

export default function Home() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [activeCategory, setActiveCategory] =
    useState("All writings");

  const [writings, setWritings] =
    useState<Writing[]>([]);

    const [communityCategoryId, setCommunityCategoryId] =
  useState<number | null>(null);
  const [loadingWritings, setLoadingWritings] =
    useState(true);

  const [writingError, setWritingError] =
    useState("");

  const [communityModalOpen, setCommunityModalOpen] =
    useState(false);

  const [communitySubmitted, setCommunitySubmitted] =
    useState(false);

  /* -----------------------------------------------------
     LOAD PUBLISHED WRITINGS
  ----------------------------------------------------- */

  useEffect(() => {
    async function loadWritings() {
      try {
        setLoadingWritings(true);
        setWritingError("");

        console.log(
          "Loading public writings..."
        );

        const response = await fetch(
          `${API_BASE_URL}/api/writings`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
            },
          }
        );

        console.log(
          "Public writings response:",
          response.status
        );

        if (!response.ok) {
          const message =
            await response.text();

          throw new Error(
            message ||
              `Failed to load writings (${response.status})`
          );
        }

        const data =
          await response.json();

        console.log(
          "PUBLIC WRITINGS:",
          data
        );

        if (Array.isArray(data)) {
          setWritings(data);
        } else {
          setWritings([]);
        }
      } catch (error) {
        console.error(
          "Failed to load public writings:",
          error
        );

        setWritingError(
          error instanceof Error
            ? error.message
            : "Unable to load writings."
        );
      } finally {
        setLoadingWritings(false);
      }
    }

    loadWritings();
  }, []);

  useEffect(() => {
  async function loadCommunityCategory() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/catalog/categories`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const communityCategory = Array.isArray(data)
        ? data.find(
            (category: {
              id: number;
              name: string;
              slug?: string;
            }) =>
              category.slug?.toLowerCase() === "community" ||
              category.name?.toLowerCase() === "community"
          )
        : null;

      if (communityCategory) {
        setCommunityCategoryId(communityCategory.id);
      }
    } catch (error) {
      console.error(
        "Failed to load Community category:",
        error
      );
    }
  }

  loadCommunityCategory();
}, []);
  /* -----------------------------------------------------
     ARCHIVE LABEL
  ----------------------------------------------------- */

  const archiveLabel = useMemo(() => {
    if (loadingWritings) {
      return "Loading the archive";
    }

    if (writings.length === 0) {
      return "A small, growing archive";
    }

    return `${writings.length} ${
      writings.length === 1
        ? "piece"
        : "pieces"
    } in the archive`;
  }, [
    writings.length,
    loadingWritings,
  ]);

  /* -----------------------------------------------------
     FEATURED WRITING
  ----------------------------------------------------- */

  /* -----------------------------------------------------
   COMMUNITY WRITINGS
----------------------------------------------------- */

const communityWritings =
  communityCategoryId !== null
    ? writings.filter(
        (writing) =>
          writing.category_id === communityCategoryId
      )
    : [];

const regularWritings =
  communityCategoryId !== null
    ? writings.filter(
        (writing) =>
          writing.category_id !== communityCategoryId
      )
    : writings;

/* -----------------------------------------------------
   FEATURED WRITING
----------------------------------------------------- */

const featuredWriting =
  regularWritings.find(
    (writing) =>
      writing.featured === true
  ) ||
  regularWritings[0] ||
  null;

/* -----------------------------------------------------
   LATEST WRITINGS
----------------------------------------------------- */

const latestWritings =
  regularWritings;

  return (
    <main className="site-shell">
      {/* =================================================
          HEADER
      ================================================= */}

      <header
        className="site-header"
        style={{
          minHeight: "105px",
          height: "105px",
          boxSizing: "border-box",
        }}
      >
        <a
          className="mark-link"
          href="#top"
          aria-label="Unfiltered Archives home"
        >
          <img
            src={MARK_IMAGE}
            alt="Unfiltered Archives"
            className="brand-mark"
            style={{
              width: "82px",
              height: "64px",
              objectFit: "contain",
              display: "block",
            }}
          />
        </a>

        <nav
          className={`desktop-nav ${
            menuOpen ? "is-open" : ""
          }`}
          aria-label="Primary navigation"
        >
          <a href="#writings">
            Writings
          </a>

          <a href="#about">
            About
          </a>

          <a href="#notes">
            Notes
          </a>
        </nav>

        <div className="header-actions">
          <button
            className="menu-button"
            aria-label={
              menuOpen
                ? "Close menu"
                : "Open menu"
            }
            onClick={() =>
              setMenuOpen(
                !menuOpen
              )
            }
          >
            {menuOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>
      </header>

      {/* =================================================
          HERO
      ================================================= */}

      <section
        id="top"
        className="hero-section"
      >
        <div className="hero-copy">
          <p className="eyebrow">
            An independent writing journal{" "}
            <span>—</span> 2026
          </p>

          <h1>
            The
            <br />
            <span>
              Unfiltered
              <br />
              Archives
            </span>
          </h1>

          <p className="hero-tagline">
            thoughts, fragments &amp;
            <br />
            everything in between.
          </p>

          <a
            className="text-link"
            href="#writings"
          >
            Read the latest{" "}
            <ArrowUpRight size={15} />
          </a>
        </div>

        <div className="hero-art-wrap">
          <img
            className="hero-art"
            src={HERO_IMAGE}
            alt="Abstract paper and fabric still life in muted mauve and cream"
          />

          <div className="hero-caption">
            <span></span>
            <span>
              
            </span>
          </div>
        </div>

      </section>

      {/* =================================================
          ABOUT
      ================================================= */}

      <section
        id="about"
        className="intro-section section-grid"
      >
        <div className="section-index">
          01{" "}
          <span>
            About the journal
          </span>
        </div>

        <div
          className="intro-statement"
          style={{
            paddingTop: "28px",
            marginLeft: "-205px",
          }}
        >
          <p
            className="kicker"
            style={{
              marginTop: 0,
            }}
          >
            A space for thoughts that stay.
          </p>

          <h2>
            The things I notice,
            <br />
            the stories I carry,
            <br />
            <em>and everything in between.</em>
          </h2>

          <style>{`
            @keyframes unfilteredLogoFloat {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-14px);
              }
            }

            @keyframes unfilteredLogoShadow {
              0%, 100% {
                transform: translateX(-50%) scaleX(1);
                opacity: 0.26;
              }
              50% {
                transform: translateX(-50%) scaleX(0.78);
                opacity: 0.12;
              }
            }
          `}</style>

          <div
            style={{
              position: "relative",
              width: "100%",
              height: "430px",
              marginTop: "22px",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              overflow: "visible",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-6px",
                left: "calc(50% + 35px)",
                width: "460px",
                height: "460px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(218,195,202,0.88) 0%, rgba(222,201,207,0.58) 42%, rgba(231,216,220,0.22) 62%, rgba(245,239,232,0) 76%)",
                filter: "blur(1px)",
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}
            />

            <img
              src={ABOUT_LOGO_IMAGE}
              alt="Unfiltered Archives"
              style={{
                position: "relative",
                zIndex: 1,
                display: "block",
                width: "400px",
                height: "400px",
                objectFit: "contain",
                borderRadius: "50%",
                marginLeft: "calc(50% - 165px)",
                animation:
                  "unfilteredLogoFloat 5.5s ease-in-out infinite",
                willChange: "transform",
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                zIndex: 0,
                left: "calc(50% + 35px)",
                bottom: "12px",
                width: "230px",
                height: "30px",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(55,40,51,0.34) 0%, rgba(55,40,51,0.16) 45%, rgba(55,40,51,0) 76%)",
                filter: "blur(8px)",
                transform: "translateX(-50%)",
                animation:
                  "unfilteredLogoShadow 5.5s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        <div
          className="intro-body"
          style={{
            maxWidth: "680px",
          }}
        >
          <p>
            The Unfiltered Archives is an
            independent personal journal
            created as a space for writing
            that does not always fit neatly
            into a category. It is a collection
            of reflections, observations,
            experiences and ideas gathered
            over time, some carefully
            considered and others simply
            written because they needed to
            exist somewhere outside my head.
          </p>

          <p>
            I am Samyuktha, a third year
            Information Technology student
            with a long standing interest in
            storytelling and creative
            expression. My interests have
            gradually expanded across
            writing, art, films and technology,
            and this archive is where those
            seemingly unrelated interests
            come together.
          </p>

          <p>
            The writing here is intentionally
            raw and does not follow a fixed
            format. The archive is not meant
            to present a perfectly polished
            version of myself. It is a place
            to document thoughts, experiences
            and perspectives as honestly as I
            can, without forcing them into a
            particular shape.
          </p>

          <p>
            If you enjoy slow reading, stories,
            deeper thoughts and noticing the
            little details that often go
            unnoticed, you might feel at home
            here. Stay awhile and follow along.
          </p>

          <a
            className="text-link"
            href="#notes"
          >
            Meet the archive{" "}
            <ArrowUpRight size={15} />
          </a>
        </div>
      </section>

      {/* =================================================
          FEATURED WRITING
      ================================================= */}

      <section
        id="writings"
        className="featured-section"
      >
        <div className="section-head">
          <div>
            <p className="kicker">
              02 / Featured writing
            </p>

            <h2>
              Read what
              <br />
              <em>
                stayed with me.
              </em>
            </h2>
          </div>

          <span className="section-meta">
            {archiveLabel}
          </span>
        </div>

        {featuredWriting ? (
          <article className="featured-piece">
            <div className="featured-image-wrap">
              <img
                src={
                  featuredWriting.cover_image_url ||
                  PAPER_IMAGE
                }
                alt={
                  featuredWriting.title
                }
              />

              <span className="image-index">
                01 /{" "}
                {String(
                  Math.max(
                    writings.length,
                    1
                  )
                ).padStart(
                  2,
                  "0"
                )}
              </span>
            </div>

            <div className="featured-copy">
              <div className="meta-row">
                <span>
                  {featuredWriting
                    .category?.name ||
                    "Writing"}
                </span>

                <span>
                  {formatDate(
                    featuredWriting.published_at ||
                      featuredWriting.created_at
                  )}
                </span>
              </div>

              <h3>
                {
                  featuredWriting.title
                }
              </h3>

              <p className="featured-excerpt">
                {featuredWriting.excerpt ||
                  "A new piece from the Unfiltered Archives."}
              </p>

              <a
                className="read-link"
                href={`/writings/${featuredWriting.id}`}
              >
                Read writing{" "}
                <ArrowUpRight size={16} />
              </a>
            </div>
          </article>
        ) : (
          <article className="featured-piece">
            <div className="featured-image-wrap">
              <img
                src="/images/sam-intro.jpg"
                alt="About Sam"
              />

              <span className="image-index">
                01 / 01
              </span>
            </div>

            <div className="featured-copy">
              <div className="meta-row">
                <span>
                  WELL NOBODY ASKED FOR IT
                </span>

                <span>
                  CRAZYY
                </span>
              </div>

              <h3>
                Unfortunately
                <br />
                I'm Sam.
              </h3>

              <p className="featured-excerpt">
                A weird little introduction to the person behind The Unfiltered Archives.
              </p>

              <a
                className="read-link"
                href="/about-sam"
              >
                Read about me{" "}
                <ArrowUpRight size={16} />
              </a>
            </div>
          </article>
        )}

        {/* Optional small loading/error information */}
        {loadingWritings && (
          <p
            style={{
              marginTop: "20px",
              color: "#947c8d",
              fontSize: "13px",
            }}
          >
            Loading the latest writings...
          </p>
        )}

        {writingError && (
          <p
            style={{
              marginTop: "20px",
              color: "#955c67",
              fontSize: "13px",
            }}
          >
            Unable to load the latest writings.
          </p>
        )}
      </section>

      {/* =================================================
          LATEST NOTES
      ================================================= */}

      <section
        id="notes"
        className="archive-section section-grid"
      >
        <div className="section-index">
          03{" "}
          <span>
            Latest notes
          </span>
        </div>

        <div className="archive-list">

          {latestWritings.length >
          0 ? (
            latestWritings.map(
              (
                writing,
                index
              ) => (
                <a
                  className={`archive-item ${
                    index % 3 ===
                    0
                      ? "ink"
                      : index % 3 ===
                          1
                        ? "mauve"
                        : "cream"
                  }`}
                  href={`/writings/${writing.id}`}
                  key={
                    writing.id
                  }
                >
                  <div className="archive-thumb">
                    <img
                      src={
                        writing.cover_image_url ||
                        [
                          PAPER_IMAGE,
                          WINDOW_IMAGE,
                          INK_IMAGE,
                        ][
                          index % 3
                        ]
                      }
                      alt=""
                    />
                  </div>

                  <div className="archive-info">
                    <div className="meta-row">
                      <span>
                        {writing
                          .category
                          ?.name ||
                          "WRITING"}
                      </span>

                      <span>
                        {formatDate(
                          writing.published_at ||
                            writing.created_at
                        )}
                      </span>
                    </div>

                    <h3>
                      {
                        writing.title
                      }
                    </h3>

                    <span className="read-length">
                      {getReadTime(
                        writing.content
                      )}
                    </span>
                  </div>

                  <ArrowUpRight
                    className="archive-arrow"
                    size={18}
                  />
                </a>
              )
            )
                    ) : null}
          <a
  className="archive-item mauve"
  href="/about-sam"
>
  <div className="archive-thumb">
    <img
      src="/images/sam-intro.jpg"
      alt="About Sam"
    />
  </div>

  <div className="archive-info">
    <div className="meta-row">
      <span>WELL NOBODY ASKED FOR IT</span>
      <span>CRAZYY</span>
    </div>

    <h3>
      Unfortunately
      <br />
      I'm Sam.
      
    </h3>

    <span className="read-length">
      A weird little introduction to the person behind The Unfiltered Archives.
    </span>
  </div>

  <ArrowUpRight
    className="archive-arrow"
    size={18}
  />
</a>
        </div>
      </section>

      {/* =================================================
    FROM THE COMMUNITY
================================================= */}

{/* ================================================= 
    FROM THE COMMUNITY 
================================================= */} 
 
<section 
  id="community" 
  className="intro-section section-grid"
  style={{
    marginTop: "90px",
    borderTop: "1px solid rgba(70, 45, 65, 0.18)",
  }}
> 
  <div className="section-index"> 
    04{" "} 
    <span> 
      From the community 
    </span> 
  </div> 
 
  <div 
  className="intro-statement" 
  style={{ 
    paddingTop: "28px", 
    marginLeft: "-205px", 
  }} 
> 
  <p 
    className="kicker" 
    style={{ 
      marginTop: 0, 
    }} 
  > 
    A space for stories beyond my own. 
  </p> 
 
  <h2> 
    For the stories that 
    <br /> 
    <em>haven't found their place yet.</em> 
  </h2>

  <div
  style={{
    position: "relative",
    width: "100%",
    marginTop: "28px",
    display: "flex",
    justifyContent: "flex-start",
  }}
>
  <img
    src="/images/community-image.png"
    alt="A community sharing stories and writing"
    style={{
      display: "block",
      width: "100%",
      maxWidth: "620px",
      height: "auto",
      objectFit: "cover",
    }}
  />
</div>
</div>
  <div 
  className="intro-body" 
  style={{ 
    maxWidth: "680px",
    paddingTop: "215px",
  }} 
>
    <p> 
      Hey, wondering if your piece could make it here too? I've got 
      you covered. So if you've got a story, a half formed thought, 
      or something you've reread a dozen times but never sent 
      anywhere, this might just be the place for it. I'll read 
      through it, and if I feel it belongs here, I'll feature it in 
      the archive along with my thoughts and perspective on what 
      you've shared. 
    </p> 
 
    <p> 
      I hope to grow this space into a community for those who 
      belong here more than they realize. The quiet writers, the 
      unsure ones, and the ones who've been waiting for a niche that 
      feels like theirs. 
    </p> 
 
    <button 
      type="button" 
      className="text-link" 
      onClick={() => { 
        setCommunitySubmitted(false); 
        setCommunityModalOpen(true); 
      }} 
      style={{ 
        border: 0, 
        background: "transparent", 
        padding: 0, 
        cursor: "pointer", 
        font: "inherit", 
      }} 
    > 
      Share your piece{" "} 
      <ArrowUpRight size={15} /> 
    </button> 
  </div> 
</section>
{/* =================================================
    COMMUNITY WRITINGS
================================================= */}

{communityWritings.length > 0 && (
  <section
    className="archive-section section-grid"
    style={{
      marginTop: "0px",
      paddingTop: "40px",
    }}
  >
    <div className="section-index">
      <span>Community writings</span>
    </div>

    <div className="archive-list">
      {communityWritings.map((writing, index) => (
        <a
          className={`archive-item ${
            index % 3 === 0
              ? "ink"
              : index % 3 === 1
                ? "mauve"
                : "cream"
          }`}
          href={`/writings/${writing.id}`}
          key={writing.id}
        >
          <div className="archive-thumb">
            <img
              src={
                writing.cover_image_url ||
                [
                  PAPER_IMAGE,
                  WINDOW_IMAGE,
                  INK_IMAGE,
                ][index % 3]
              }
              alt=""
            />
          </div>

          <div className="archive-info">
            <div className="meta-row">
              <span>FROM THE COMMUNITY</span>

              <span>
                {formatDate(
                  writing.published_at ||
                    writing.created_at
                )}
              </span>
            </div>

            <h3>{writing.title}</h3>

            <span className="read-length">
              {getReadTime(writing.content)}
            </span>
          </div>

          <ArrowUpRight
            className="archive-arrow"
            size={18}
          />
        </a>
      ))}
    </div>
  </section>
)}
      {/* =================================================
          COMMUNITY SUBMISSION POPUP
      ================================================= */}

      {communityModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="community-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCommunityModalOpen(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background:
              "rgba(43, 29, 40, 0.48)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "min(720px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#f7f1e9",
              padding: "42px",
              boxSizing: "border-box",
              boxShadow:
                "0 28px 80px rgba(43, 29, 40, 0.22)",
            }}
          >
            <button
              type="button"
              aria-label="Close submission form"
              onClick={() =>
                setCommunityModalOpen(false)
              }
              style={{
                position: "absolute",
                top: "18px",
                right: "20px",
                border: 0,
                background: "transparent",
                color: "#594454",
                fontSize: "24px",
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {!communitySubmitted ? (
              <>
                <p className="kicker">
                  From the community
                </p>

                <h2
                  id="community-modal-title"
                  style={{
                    marginTop: "12px",
                    marginBottom: "12px",
                  }}
                >
                  Share your piece.
                </h2>

                <p
                  style={{
                    marginTop: 0,
                    marginBottom: "30px",
                    color: "#705d69",
                    lineHeight: 1.7,
                  }}
                >
                  Send something you've written. I'll read through every
                  submission and get in touch if I'd like to feature it in
                  the archive.
                </p>

                <form
  onSubmit={async (event) => {
  event.preventDefault();

  const form = event.currentTarget;

  const nameInput = form.querySelector(
    'input[name="name"]'
  ) as HTMLInputElement | null;

  const emailInput = form.querySelector(
    'input[name="email"]'
  ) as HTMLInputElement | null;

  const titleInput = form.querySelector(
    'input[name="title"]'
  ) as HTMLInputElement | null;

  const writingInput = form.querySelector(
    'textarea[name="writing"]'
  ) as HTMLTextAreaElement | null;

  const consentInput = form.querySelector(
    'input[type="checkbox"]'
  ) as HTMLInputElement | null;

  const name = nameInput?.value.trim() || "";
  const email = emailInput?.value.trim() || "";
  const title = titleInput?.value.trim() || "";
  const content = writingInput?.value.trim() || "";
  const consent = consentInput?.checked === true;

  if (!consent) {
    alert("Please tick the consent checkbox.");
    return;
  }

  try {
    const params = new URLSearchParams();

    params.append("name", name);
    params.append("email", email);
    params.append("title", title);
    params.append("content", content);
    params.append("consent", "true");

    const response = await fetch(
      `${API_BASE_URL}/api/community/submissions?${params.toString()}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to submit your piece.");
    }

    setCommunitySubmitted(true);
  } catch (error) {
    console.error("Community submission failed:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Unable to submit your piece."
    );
  }
}}
                  style={{
                    display: "grid",
                    gap: "18px",
                  }}
                >
                  <label
                    style={{
                      display: "grid",
                      gap: "8px",
                      color: "#594454",
                      fontSize: "13px",
                    }}
                  >
                    Name or pen name
                    <input
                      name="name"
                      required
                      placeholder="How should I credit you?"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        border:
                          "1px solid rgba(89, 68, 84, 0.20)",
                        background: "#fffaf4",
                        padding: "14px 15px",
                        color: "#3f3040",
                        font: "inherit",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "grid",
                      gap: "8px",
                      color: "#594454",
                      fontSize: "13px",
                    }}
                  >
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="Where I can reach you"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        border:
                          "1px solid rgba(89, 68, 84, 0.20)",
                        background: "#fffaf4",
                        padding: "14px 15px",
                        color: "#3f3040",
                        font: "inherit",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "grid",
                      gap: "8px",
                      color: "#594454",
                      fontSize: "13px",
                    }}
                  >
                    Title
                    <input
                      name="title"
                      required
                      placeholder="Give your piece a name"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        border:
                          "1px solid rgba(89, 68, 84, 0.20)",
                        background: "#fffaf4",
                        padding: "14px 15px",
                        color: "#3f3040",
                        font: "inherit",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "grid",
                      gap: "8px",
                      color: "#594454",
                      fontSize: "13px",
                    }}
                  >
                    Your writing
                    <textarea
                      name="writing"
                      required
                      rows={10}
                      placeholder="Write, paste, ramble. I'll read it all."
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        resize: "vertical",
                        border:
                          "1px solid rgba(89, 68, 84, 0.20)",
                        background: "#fffaf4",
                        padding: "14px 15px",
                        color: "#3f3040",
                        font: "inherit",
                        lineHeight: 1.7,
                        outline: "none",
                      }}
                    />
                  </label>

                  <label
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      color: "#705d69",
                      fontSize: "12px",
                      lineHeight: 1.6,
                    }}
                  >
                    <input
                      type="checkbox"
                      required
                      style={{
                        marginTop: "3px",
                      }}
                    />
                    <span>
                       I consent to my work being considered for publication on The Unfiltered Archives.
                    </span>
                  </label>

                  <button
                    type="submit"
                    style={{
                      marginTop: "8px",
                      border: 0,
                      background: "#4c3849",
                      color: "#fffaf4",
                      padding: "14px 20px",
                      cursor: "pointer",
                      font: "inherit",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Send my piece →
                  </button>
                </form>
              </>
            ) : (
              <div
                style={{
                  minHeight: "360px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <p className="kicker">
                  Thank you
                </p>

                <h2
                  id="community-modal-title"
                  style={{
                    marginTop: "12px",
                    marginBottom: "18px",
                  }}
                >
                  Your piece is on its way.
                </h2>

                <p
                  style={{
                    maxWidth: "520px",
                    color: "#705d69",
                    lineHeight: 1.8,
                    marginBottom: "30px",
                  }}
                >
                  I'll read through it and let you know if it makes its way into the archive.
                </p>

                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    setCommunityModalOpen(false)
                  }
                  style={{
                    border: 0,
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    font: "inherit",
                  }}
                >
                  Back to the archive{" "}
                  <ArrowUpRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section
        id="categories"
        className="categories-section"
      >
        <div className="section-index">
          05{" "}
          <span>
            Find your way in
          </span>
        </div>

        <div className="category-stage">
          <p className="kicker">
            Choose a doorway
          </p>

          <h2>
            Where would you
            <br />
            <em>
              like to begin?
            </em>
          </h2>

          <div className="category-pills">
            {categories.map((category) => {
  const destinations: Record<string, string> = {
    "Latest notes": "#notes",
    "Community": "#community",
    "About the archive": "#about",
  };

  if (category === "Most read") {
    return (
      <button
        key={category}
        onClick={() => {
          const sorted = [...latestWritings].sort(
            (a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)
          );

          if (sorted.length > 0) {
            window.location.href = `/writings/${sorted[0].id}`;
          }
        }}
      >
        {category}
        <span>↗</span>
      </button>
    );
  }

  return (
    <button
      key={category}
      onClick={() => {
        const destination = destinations[category];

        if (destination) {
          window.location.href = destination;
        }
      }}
    >
      {category}
      <span>↗</span>
    </button>
  );
})}
          </div>
        </div>
      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="site-footer">
        <div className="footer-brand">
          <img
            src={MARK_IMAGE}
            alt=""
            className="brand-mark"
          />

          <span>
            Unfiltered Archives
          </span>
        </div>

        <p>
          words, thoughts &amp;
          things left unsaid
        </p>

        

          <div className="footer-links">
  <a href="#top">
    Back to top <ArrowUpRight size={14} />
  </a>

  <a
    href="https://www.instagram.com/theunfilteredarchives_/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Instagram size={14} />
    Instagram
  </a>

  <button
    type="button"
    onClick={() => {
      setCommunitySubmitted(false);
      setCommunityModalOpen(true);
    }}
  >
    Share your piece <ArrowUpRight size={14} />
  </button>

  <a href="#about">
    About <ArrowUpRight size={14} />
  </a>
</div>

        <div className="footer-bottom">
          <span>
            © 2026 Unfiltered Archives
          </span>

          <span>
            Made for people who read the footnotes.
          </span>
        </div>
      </footer>

    </main>
  );
}