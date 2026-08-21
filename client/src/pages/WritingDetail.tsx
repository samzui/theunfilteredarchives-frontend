import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { GoogleLogin } from "@react-oauth/google";

const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

function getVisitorKey() {
  let visitorKey = localStorage.getItem("visitor_key");

  if (!visitorKey) {
    visitorKey = crypto.randomUUID();
    localStorage.setItem("visitor_key", visitorKey);
  }

  return visitorKey;
}
/* =======================================================
   TYPES
======================================================= */

type Category = {
  id: number;
  name: string;
};

type Tag = {
  id: number;
  name: string;
};

type Writing = {
  id: number;
  title: string;
  content: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  category_id?: number | null;
  category?: Category | null;
  tags?: Tag[];
  status?: string | null;
  featured?: boolean;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  view_count?: number;
};

type Comment = {
  id: number;
  content: string;
  status: string;
  author_id: number;
  author_name: string;
  writing_id: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
};

/* =======================================================
   DATE
======================================================= */

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCommentDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/* =======================================================
   SAFE TIPTAP HTML
======================================================= */

function sanitizeTiptapHtml(html: string) {
  if (!html) {
    return "";
  }

  const parser = new DOMParser();

  const document = parser.parseFromString(
    html,
    "text/html"
  );

  document
    .querySelectorAll(
      "script, iframe, object, embed, form, base, meta, link, style"
    )
    .forEach((element) => {
      element.remove();
    });

  document.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach(
      (attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim();

        if (
          name.startsWith("on") ||
          name === "formaction" ||
          name === "xlink:href"
        ) {
          element.removeAttribute(attribute.name);
          return;
        }

        if (
          (name === "href" ||
            name === "src" ||
            name === "action") &&
          /^javascript:/i.test(value)
        ) {
          element.removeAttribute(attribute.name);
        }
      }
    );
  });

  document
    .querySelectorAll("a")
    .forEach((link) => {
      const href =
        link.getAttribute("href") || "";

      if (
        href &&
        !/^(https?:|mailto:|tel:|\/|#)/i.test(
          href
        )
      ) {
        link.removeAttribute("href");
        return;
      }

      if (/^https?:\/\//i.test(href)) {
        link.setAttribute(
          "target",
          "_blank"
        );

        link.setAttribute(
          "rel",
          "noopener noreferrer"
        );
      }
    });

  return document.body.innerHTML;
}

/* =======================================================
   ERROR STATE
======================================================= */

function ErrorState({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf7fa",
        color: "#3e2d3c",
        fontFamily:
          '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            letterSpacing: "0.18em",
            color: "#947c8d",
            marginBottom: "18px",
          }}
        >
          UNFILTERED ARCHIVES
        </div>

        <h1
          style={{
            margin: "0 0 15px",
            fontFamily:
              "Georgia, 'Times New Roman', serif",
            fontWeight: 400,
            fontSize: "42px",
            color: "#342332",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: "0 auto 30px",
            maxWidth: "480px",
            color: "#806b7b",
            fontSize: "15px",
            lineHeight: 1.7,
          }}
        >
          {message}
        </p>

        <button
          type="button"
          onClick={onBack}
          style={{
            border: "1px solid #d9c9d5",
            background: "#fff",
            color: "#674f64",
            padding: "13px 22px",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          ← Back to writings
        </button>
      </div>
    </div>
  );
}

/* =======================================================
   MAIN PAGE
======================================================= */

export default function WritingDetail() {
  const [, setLocation] = useLocation();

  const [, params] = useRoute(
    "/writings/:id"
  );

  const writingId = params?.id;

  const [writing, setWriting] =
    useState<Writing | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =====================================================
     WRITING LIKE STATE
  ===================================================== */

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] =
    useState(false);

  /* =====================================================
     BOOKMARK STATE
  ===================================================== */

  const [bookmarked, setBookmarked] =
    useState(false);

  const [bookmarkLoading, setBookmarkLoading] =
    useState(false);

  /*
   * Used when a logged-out user clicks Bookmark.
   * After Google login succeeds, the bookmark action
   * is completed automatically.
   */
  const [pendingBookmark, setPendingBookmark] =
    useState(false);

  /* =====================================================
     GOOGLE LOGIN STATE
  ===================================================== */

  const [showGoogleLogin, setShowGoogleLogin] =
    useState(false);

  const [googleLoginError, setGoogleLoginError] =
    useState("");

  /*
   * If Google login was triggered by a comment,
   * remember which parent comment the user wanted
   * to reply to.
   *
   * null = new top-level comment
   * number = reply to that comment
   */

  const [
    pendingCommentParentId,
    setPendingCommentParentId,
  ] = useState<number | null>(null);

  /* =====================================================
     COMMENT STATE
  ===================================================== */

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [commentsError, setCommentsError] =
    useState("");

  const [commentText, setCommentText] =
    useState("");

  const [commentSubmitting, setCommentSubmitting] =
    useState(false);

  const [replyingTo, setReplyingTo] =
    useState<number | null>(null);

  const [replyText, setReplyText] =
    useState("");

  const [editingCommentId, setEditingCommentId] =
    useState<number | null>(null);

  const [editingText, setEditingText] =
    useState("");

  const [commentActionLoading, setCommentActionLoading] =
    useState<number | null>(null);

  /* =====================================================
     CURRENT USER ID
  ===================================================== */

  const [currentUserId, setCurrentUserId] =
    useState<number | null>(null);

  /* =====================================================
     LOAD CURRENT USER
  ===================================================== */

  useEffect(() => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setCurrentUserId(null);
      return;
    }

    async function loadCurrentUser() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem(
            "access_token"
          );
          setCurrentUserId(null);
          return;
        }

        if (!response.ok) {
          return;
        }

        const user = await response.json();

        setCurrentUserId(
          Number(user.id) || null
        );
      } catch (err) {
        console.error(
          "Failed to load current user:",
          err
        );
      }
    }

    loadCurrentUser();
  }, []);

  /* =====================================================
     LOAD WRITING
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadWriting() {
      if (!writingId) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setError("");
        setNotFound(false);

        const response = await fetch(
          `${API_BASE_URL}/api/writings/${writingId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.status === 404) {
          if (!cancelled) {
            setNotFound(true);
            setWriting(null);
          }

          return;
        }

        if (!response.ok) {
          const message =
            await response.text();

          throw new Error(
            message ||
              "Failed to load this writing."
          );
        }

        const data: Writing =
          await response.json();

        if (!cancelled) {
          setWriting(data);
        }
      } catch (err) {
        console.error(
          "Failed to load writing:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this writing."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWriting();

    return () => {
      cancelled = true;
    };
  }, [writingId]);

 /* =====================================================
   RECORD WRITING VIEW
===================================================== */

useEffect(() => {
  if (!writingId) {
    return;
  }

  const token =
    localStorage.getItem("access_token");

  const visitorKey = getVisitorKey();

  async function recordView() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/writings/${writingId}/view`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "X-Visitor-Key": visitorKey,

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      if (!response.ok) {
        const message =
          await response.text();

        console.error(
          "View recording failed:",
          response.status,
          message
        );
      }
    } catch (err) {
      console.error(
        "Failed to record writing view:",
        err
      );
    }
  }

  recordView();
}, [writingId]);
  /* =====================================================
     LOAD LIKE STATUS
  ===================================================== */

  useEffect(() => {
    if (!writingId) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    async function loadPublicLikeCount() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/writings/${writingId}/like-count`,
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

        setLikeCount(
          Number(data.likes) || 0
        );

        setLiked(false);
      } catch (err) {
        console.error(
          "Failed to load like count:",
          err
        );
      }
    }

    async function loadLikeStatus() {
      try {
        if (!token) {
          await loadPublicLikeCount();
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/writings/${writingId}/like-status`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem(
            "access_token"
          );

          await loadPublicLikeCount();
          return;
        }

        if (!response.ok) {
          await loadPublicLikeCount();
          return;
        }

        const data = await response.json();

        setLiked(Boolean(data.liked));

        setLikeCount(
          Number(data.likes) || 0
        );
      } catch (err) {
        console.error(
          "Failed to load like status:",
          err
        );

        await loadPublicLikeCount();
      }
    }

    loadLikeStatus();
  }, [writingId]);

  /* =====================================================
     LOAD BOOKMARK STATUS
  ===================================================== */

  async function loadBookmarkStatus() {
    if (!writingId) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setBookmarked(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookmarks`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );
        setCurrentUserId(null);
        setBookmarked(false);
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const saved =
        Array.isArray(data) &&
        data.some(
          (bookmark: {
            writing_id?: number;
          }) =>
            Number(bookmark.writing_id) ===
            Number(writingId)
        );

      setBookmarked(saved);
    } catch (err) {
      console.error(
        "Failed to load bookmark status:",
        err
      );
    }
  }

  useEffect(() => {
    loadBookmarkStatus();
  }, [writingId]);

  /* =====================================================
     LOAD COMMENTS
  ===================================================== */

  async function loadComments() {
    if (!writingId) {
      return;
    }

    try {
      setCommentsLoading(true);
      setCommentsError("");

      const response = await fetch(
        `${API_BASE_URL}/api/writings/${writingId}/comments`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load comments."
        );
      }

      const data: Comment[] =
        await response.json();

      setComments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load comments:",
        err
      );

      setCommentsError(
        "Unable to load comments right now."
      );
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    if (writingId) {
      loadComments();
    }
  }, [writingId]);

  /* =====================================================
     LIKE / UNLIKE WRITING
  ===================================================== */

  async function handleLike() {
    if (!writingId || likeLoading) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setGoogleLoginError("");
      setPendingCommentParentId(null);
      setShowGoogleLogin(true);
      return;
    }

    try {
      setLikeLoading(true);
      setGoogleLoginError("");

      const response = await fetch(
        `${API_BASE_URL}/api/writings/${writingId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        setCurrentUserId(null);
        setLiked(false);
        setShowGoogleLogin(true);

        return;
      }

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message ||
            "Failed to update like."
        );
      }

      const data = await response.json();

      setLiked(
        data.action === "liked"
      );

      setLikeCount(
        Number(data.likes) || 0
      );
    } catch (err) {
      console.error(
        "Like failed:",
        err
      );

      setError(
        "Unable to update your like. Please try again."
      );
    } finally {
      setLikeLoading(false);
    }
  }

  /* =====================================================
     BOOKMARK / REMOVE BOOKMARK
  ===================================================== */

  async function handleBookmark() {
    if (!writingId || bookmarkLoading) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setGoogleLoginError("");
      setPendingBookmark(true);
      setPendingCommentParentId(null);
      setShowGoogleLogin(true);
      return;
    }

    try {
      setBookmarkLoading(true);
      setGoogleLoginError("");

      const response = await fetch(
        `${API_BASE_URL}/api/writings/${writingId}/bookmark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        setCurrentUserId(null);
        setBookmarked(false);
        setPendingBookmark(true);
        setShowGoogleLogin(true);
        return;
      }

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message ||
            "Failed to update bookmark."
        );
      }

      const data = await response.json();

      setBookmarked(
        data.action === "saved"
      );
    } catch (err) {
      console.error(
        "Bookmark failed:",
        err
      );

      setError(
        "Unable to update your bookmark. Please try again."
      );
    } finally {
      setBookmarkLoading(false);
    }
  }

  /* =====================================================
     POST COMMENT
  ===================================================== */

  async function submitComment(
    parentId: number | null = null,
    textOverride?: string
  ) {
    if (!writingId) {
      return;
    }

    const text =
      textOverride !== undefined
        ? textOverride.trim()
        : commentText.trim();

    if (!text) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    /*
     * Not logged in:
     * ask for Google authentication.
     */

    if (!token) {
      setPendingCommentParentId(
        parentId
      );

      setGoogleLoginError("");

      setShowGoogleLogin(true);

      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentsError("");

      const response = await fetch(
        `${API_BASE_URL}/api/writings/${writingId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            content: text,
            parent_id: parentId,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        setCurrentUserId(null);

        setPendingCommentParentId(
          parentId
        );

        setShowGoogleLogin(true);

        return;
      }

      if (!response.ok) {
        const data =
          await response.json().catch(
            () => null
          );

        throw new Error(
          data?.detail ||
            "Failed to post comment."
        );
      }

      const newComment: Comment =
        await response.json();

      setComments((previous) => [
        ...previous,
        newComment,
      ]);

      if (parentId === null) {
        setCommentText("");
      } else {
        setReplyText("");
        setReplyingTo(null);
      }
    } catch (err) {
      console.error(
        "Failed to post comment:",
        err
      );

      setCommentsError(
        err instanceof Error
          ? err.message
          : "Unable to post comment."
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  /* =====================================================
     START COMMENT
  ===================================================== */

  function handleCommentBoxClick() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setPendingCommentParentId(null);
      setGoogleLoginError("");
      setShowGoogleLogin(true);
    }
  }

  /* =====================================================
     START REPLY
  ===================================================== */
function handleReplyClick(commentId: number) {
  const token = localStorage.getItem("access_token");

  // If the user is not logged in,
  // ask them to sign in with Google.
  if (!token) {
    setPendingCommentParentId(commentId);
    setGoogleLoginError("");
    setShowGoogleLogin(true);
    return;
  }

  // Already logged in:
  // simply open the reply box.
  setReplyingTo(commentId);
  setReplyText("");
  setEditingCommentId(null);
}

  /* =====================================================
     EDIT COMMENT
  ===================================================== */

  function startEditing(
    comment: Comment
  ) {
    setEditingCommentId(
      comment.id
    );

    setEditingText(
      comment.content
    );

    setReplyingTo(null);
  }

  async function saveEdit(
    commentId: number
  ) {
    const text =
      editingText.trim();

    if (!text) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setShowGoogleLogin(true);
      return;
    }

    try {
      setCommentActionLoading(
        commentId
      );

      const response = await fetch(
        `${API_BASE_URL}/api/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            content: text,
            parent_id:
              comments.find(
                (comment) =>
                  comment.id ===
                  commentId
              )?.parent_id ?? null,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        setCurrentUserId(null);
        setShowGoogleLogin(true);

        return;
      }

      if (!response.ok) {
        const data =
          await response.json().catch(
            () => null
          );

        throw new Error(
          data?.detail ||
            "Failed to edit comment."
        );
      }

      const updatedComment: Comment =
        await response.json();

      setComments((previous) =>
        previous.map((comment) =>
          comment.id === commentId
            ? updatedComment
            : comment
        )
      );

      setEditingCommentId(null);
      setEditingText("");
    } catch (err) {
      console.error(
        "Failed to edit comment:",
        err
      );

      setCommentsError(
        err instanceof Error
          ? err.message
          : "Unable to edit comment."
      );
    } finally {
      setCommentActionLoading(
        null
      );
    }
  }

  /* =====================================================
     DELETE COMMENT
  ===================================================== */

  async function deleteComment(
    commentId: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this comment?"
      );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setShowGoogleLogin(true);
      return;
    }

    try {
      setCommentActionLoading(
        commentId
      );

      const response = await fetch(
        `${API_BASE_URL}/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        setCurrentUserId(null);
        setShowGoogleLogin(true);

        return;
      }

      if (!response.ok) {
        const data =
          await response.json().catch(
            () => null
          );

        throw new Error(
          data?.detail ||
            "Failed to delete comment."
        );
      }

      /*
       * Reload instead of manually removing
       * the comment because comments can have
       * replies.
       */

      await loadComments();

      if (
        editingCommentId ===
        commentId
      ) {
        setEditingCommentId(null);
        setEditingText("");
      }
    } catch (err) {
      console.error(
        "Failed to delete comment:",
        err
      );

      setCommentsError(
        err instanceof Error
          ? err.message
          : "Unable to delete comment."
      );
    } finally {
      setCommentActionLoading(
        null
      );
    }
  }

  /* =====================================================
     GOOGLE LOGIN
  ===================================================== */

  async function handleGoogleLoginSuccess(
    credential: string
  ) {
    try {
      setLikeLoading(true);
      setGoogleLoginError("");

      const response = await fetch(
        `${API_BASE_URL}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            credential,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Google login failed."
        );
      }

      if (!data.access_token) {
        throw new Error(
          "Google login succeeded but no application token was returned."
        );
      }

      /*
       * Save the application JWT.
       */

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      /*
       * Fetch the current user so that
       * edit/delete ownership works immediately.
       */

      try {
        const meResponse =
          await fetch(
            `${API_BASE_URL}/api/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${data.access_token}`,
                Accept:
                  "application/json",
              },
            }
          );

        if (meResponse.ok) {
          const user =
            await meResponse.json();

          setCurrentUserId(
            Number(user.id) || null
          );
        }
      } catch (err) {
        console.error(
          "Failed to load Google user:",
          err
        );
      }

      setShowGoogleLogin(false);

      /*
       * If login was triggered by Bookmark,
       * complete the bookmark action now.
       */
      if (pendingBookmark) {
        setPendingBookmark(false);
        await handleBookmark();
        return;
      }

      /*
       * If login was triggered by a comment,
       * immediately submit that comment.
       */

      if (
        pendingCommentParentId !==
        null
      ) {
        const parentId =
          pendingCommentParentId;

        setPendingCommentParentId(
          null
        );

        /*
         * For a reply, the reply box contains
         * the text the user entered before login.
         */

        if (replyText.trim()) {
          await submitComment(
            parentId,
            replyText
          );
        }

        return;
      }

      /*
       * If the user was trying to write
       * a new comment, don't automatically
       * create an empty comment.
       *
       * Just let the comment box become
       * available.
       */

      if (
        pendingCommentParentId ===
        null &&
        commentText.trim()
      ) {
        await submitComment(
          null,
          commentText
        );
      }
    } catch (err) {
      console.error(
        "Google login failed:",
        err
      );

      setGoogleLoginError(
        err instanceof Error
          ? err.message
          : "Google login failed. Please try again."
      );
    } finally {
      setLikeLoading(false);
    }
  }

  /* =====================================================
     COMMENT TREE
  ===================================================== */

  const rootComments = useMemo(
    () =>
      comments.filter(
        (comment) =>
          comment.parent_id ===
          null
      ),
    [comments]
  );

  function getReplies(
    commentId: number
  ) {
    return comments.filter(
      (comment) =>
        comment.parent_id ===
        commentId
    );
  }

  /* =====================================================
     COMMENT COMPONENT
  ===================================================== */

  function renderComment(
    comment: Comment,
    depth = 0
  ): React.ReactNode {
    const replies =
      getReplies(comment.id);

    const isOwner =
      currentUserId !== null &&
      currentUserId ===
        comment.author_id;

    const isEditing =
      editingCommentId ===
      comment.id;

    const isReplying =
      replyingTo ===
      comment.id;

    return (
      <div
        key={comment.id}
        style={{
          marginTop:
            depth === 0
              ? "0"
              : "22px",
          marginLeft:
            depth === 0
              ? "0"
              : "38px",
          paddingLeft:
            depth === 0
              ? "0"
              : "20px",
          borderLeft:
            depth === 0
              ? "none"
              : "1px solid #e5d9e1",
        }}
      >
        <div
          style={{
            borderBottom:
              "1px solid #eee5eb",
            paddingBottom:
              "22px",
          }}
        >
          {/* AUTHOR + DATE */}

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: "15px",
              marginBottom:
                "10px",
            }}
          >
            <div
              style={{
                fontFamily:
                  "Georgia, 'Times New Roman', serif",
                color:
                  "#4c3849",
                fontSize:
                  "16px",
              }}
            >
              {comment.author_name}
            </div>

            <div
              style={{
                color:
                  "#a18e9c",
                fontSize:
                  "11px",
                whiteSpace:
                  "nowrap",
              }}
            >
              {formatCommentDate(
                comment.created_at
              )}
            </div>
          </div>

          {/* COMMENT BODY */}

          {isEditing ? (
            <div>
              <textarea
                value={
                  editingText
                }
                onChange={(
                  event
                ) =>
                  setEditingText(
                    event.target
                      .value
                  )
                }
                rows={4}
                maxLength={5000}
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  resize:
                    "vertical",
                  border:
                    "1px solid #d9c9d5",
                  background:
                    "#fff",
                  color:
                    "#443444",
                  padding:
                    "12px",
                  fontFamily:
                    "inherit",
                  fontSize:
                    "14px",
                  lineHeight:
                    1.6,
                  outline:
                    "none",
                }}
              />

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  marginTop:
                    "10px",
                }}
              >
                <button
                  type="button"
                  disabled={
                    commentActionLoading ===
                    comment.id
                  }
                  onClick={() =>
                    saveEdit(
                      comment.id
                    )
                  }
                  style={{
                    border:
                      "1px solid #8b6b84",
                    background:
                      "#674f64",
                    color:
                      "#fff",
                    padding:
                      "8px 15px",
                    cursor:
                      "pointer",
                    fontSize:
                      "12px",
                  }}
                >
                  {commentActionLoading ===
                  comment.id
                    ? "Saving..."
                    : "Save"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingCommentId(
                      null
                    );
                    setEditingText(
                      ""
                    );
                  }}
                  style={{
                    border:
                      "1px solid #d9c9d5",
                    background:
                      "#fff",
                    color:
                      "#674f64",
                    padding:
                      "8px 15px",
                    cursor:
                      "pointer",
                    fontSize:
                      "12px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              style={{
                margin:
                  "0 0 14px",
                color:
                  "#665566",
                fontSize:
                  "14px",
                lineHeight:
                  1.75,
                whiteSpace:
                  "pre-wrap",
                wordBreak:
                  "break-word",
              }}
            >
              {comment.content}
            </p>
          )}

          {/* ACTIONS */}

          {!isEditing && (
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                flexWrap:
                  "wrap",
                gap:
                  "14px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  handleReplyClick(
                    comment.id
                  )
                }
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  color:
                    "#8b7283",
                  padding:
                    "0",
                  cursor:
                    "pointer",
                  fontSize:
                    "12px",
                }}
              >
                Reply
              </button>

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      startEditing(
                        comment
                      )
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#8b7283",
                      padding:
                        "0",
                      cursor:
                        "pointer",
                      fontSize:
                        "12px",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={
                      commentActionLoading ===
                      comment.id
                    }
                    onClick={() =>
                      deleteComment(
                        comment.id
                      )
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#a16f7a",
                      padding:
                        "0",
                      cursor:
                        "pointer",
                      fontSize:
                        "12px",
                    }}
                  >
                    {commentActionLoading ===
                    comment.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* REPLY BOX */}

          {isReplying && (
            <div
              style={{
                marginTop:
                  "18px",
                padding:
                  "15px",
                background:
                  "#fbf8fa",
                border:
                  "1px solid #e8dce4",
              }}
            >
              <div
                style={{
                  fontSize:
                    "11px",
                  color:
                    "#947c8d",
                  marginBottom:
                    "8px",
                  letterSpacing:
                    "0.08em",
                  textTransform:
                    "uppercase",
                }}
              >
                Reply
              </div>

              <textarea
                value={
                  replyText
                }
                onChange={(
                  event
                ) =>
                  setReplyText(
                    event.target
                      .value
                  )
                }
                placeholder="Write your reply..."
                rows={3}
                maxLength={5000}
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  resize:
                    "vertical",
                  border:
                    "1px solid #d9c9d5",
                  background:
                    "#fff",
                  color:
                    "#443444",
                  padding:
                    "11px",
                  fontFamily:
                    "inherit",
                  fontSize:
                    "13px",
                  lineHeight:
                    1.6,
                  outline:
                    "none",
                }}
              />

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  marginTop:
                    "10px",
                }}
              >
                <button
                  type="button"
                  disabled={
                    commentSubmitting ||
                    !replyText.trim()
                  }
                  onClick={() =>
                    submitComment(
                      comment.id,
                      replyText
                    )
                  }
                  style={{
                    border:
                      "1px solid #8b6b84",
                    background:
                      "#674f64",
                    color:
                      "#fff",
                    padding:
                      "8px 15px",
                    cursor:
                      "pointer",
                    fontSize:
                      "12px",
                    opacity:
                      commentSubmitting ||
                      !replyText.trim()
                        ? 0.5
                        : 1,
                  }}
                >
                  {commentSubmitting
                    ? "Posting..."
                    : "Reply"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(
                      null
                    );
                    setReplyText(
                      ""
                    );
                  }}
                  style={{
                    border:
                      "1px solid #d9c9d5",
                    background:
                      "#fff",
                    color:
                      "#674f64",
                    padding:
                      "8px 15px",
                    cursor:
                      "pointer",
                    fontSize:
                      "12px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* REPLIES */}

        {replies.map(
          (reply) =>
            renderComment(
              reply,
              depth + 1
            )
        )}
      </div>
    );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
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
          fontSize: "14px",
        }}
      >
        Loading writing...
      </div>
    );
  }

  /* =====================================================
     404
  ===================================================== */

  if (notFound) {
    return (
      <ErrorState
        title="Writing not found"
        message="This writing may not exist, or it may still be a draft."
        onBack={() => setLocation("/")}
      />
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !writing) {
    return (
      <ErrorState
        title="Something went wrong"
        message={
          error ||
          "We couldn't load this writing."
        }
        onBack={() => setLocation("/")}
      />
    );
  }

  /* =====================================================
     CONTENT
  ===================================================== */

  const safeContent =
    sanitizeTiptapHtml(
      writing.content || ""
    );

  const publishedDate =
    formatDate(
      writing.published_at ||
        writing.created_at
    );

  const categoryName =
    writing.category?.name || "";

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf7fa",
        color: "#3e2d3c",
        fontFamily:
          '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <header
        style={{
          background: "#fff",
          borderBottom:
            "1px solid #eadfe7",
          padding:
            "22px 45px",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "20px",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setLocation("/")
          }
          style={{
            border: "none",
            background:
              "transparent",
            color: "#806a7b",
            cursor:
              "pointer",
            padding: 0,
            fontSize:
              "13px",
          }}
        >
          ← Unfiltered Archives
        </button>

        <div
          style={{
            fontFamily:
              "Georgia, 'Times New Roman', serif",
            fontSize: "20px",
            color: "#342332",
          }}
        >
          Unfiltered Archives
        </div>

        <div
          style={{
            width: "120px",
          }}
        />
      </header>

      {/* =================================================
          ARTICLE
      ================================================= */}

      <main>
        <article
          style={{
            maxWidth:
              "900px",
            margin:
              "0 auto",
            padding:
              "70px 30px 100px",
          }}
        >
          {/* CATEGORY / DATE */}

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              flexWrap:
                "wrap",
              gap: "10px",
              marginBottom:
                "22px",
              color:
                "#947c8d",
              fontSize:
                "12px",
              letterSpacing:
                "0.12em",
              textTransform:
                "uppercase",
            }}
          >
            {categoryName && (
              <>
                <span>
                  {categoryName}
                </span>

                {publishedDate && (
                  <span>
                    ·
                  </span>
                )}
              </>
            )}

            {publishedDate && (
              <span>
                {publishedDate}
              </span>
            )}
          </div>

          {/* TITLE */}

          <h1
            style={{
              margin:
                "0 auto 25px",
              maxWidth:
                "820px",
              textAlign:
                "center",
              fontFamily:
                "Georgia, 'Times New Roman', serif",
              fontSize:
                "clamp(38px, 6vw, 68px)",
              lineHeight:
                1.08,
              fontWeight:
                400,
              letterSpacing:
                "-0.025em",
              color:
                "#342332",
            }}
          >
            {writing.title}
          </h1>

          {/* EXCERPT */}

          {writing.excerpt && (
            <p
              style={{
                maxWidth:
                  "680px",
                margin:
                  "0 auto 42px",
                textAlign:
                  "center",
                fontFamily:
                  "Georgia, 'Times New Roman', serif",
                fontSize:
                  "18px",
                lineHeight:
                  1.7,
                fontStyle:
                  "italic",
                color:
                  "#806b7b",
              }}
            >
              {writing.excerpt}
            </p>
          )}

          {/* COVER IMAGE */}

{writing.cover_image_url && (
  <figure
    style={{
      margin: "0 0 55px",
      width: "100%",
    }}
  >
    <img
      src={writing.cover_image_url}
      alt={writing.title}
      style={{
        width: "100%",
        maxHeight: "600px",
        height: "auto",
        objectFit: "cover",
        display: "block",
      }}
      onLoad={() => {
        console.log("COVER IMAGE LOADED");
      }}
      onError={(event) => {
        console.error(
          "COVER IMAGE FAILED:",
          writing.cover_image_url
        );
        event.currentTarget.style.display = "block";
      }}
    />
  </figure>
)}

{/* WRITING */}

          <div
            className="public-writing-content"
            dangerouslySetInnerHTML={{
              __html:
                safeContent,
            }}
          />

          {/* =================================================
              WRITING LIKE
          ================================================= */}

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "center",
              alignItems:
                "center",
              gap:
                "24px",
              marginTop:
                "50px",
              marginBottom:
                "20px",
            }}
          >
            <button
              type="button"
              onClick={handleLike}
              disabled={likeLoading}
              aria-pressed={
                liked
              }
              style={{
                border:
                  "1px solid #d9c9d5",
                background:
                  liked
                    ? "#f1e4ed"
                    : "#fff",
                color:
                  "#674f64",
                padding:
                  "12px 22px",
                borderRadius:
                  "4px",
                cursor:
                  likeLoading
                    ? "wait"
                    : "pointer",
                fontSize:
                  "14px",
                transition:
                  "all 0.2s ease",
                opacity:
                  likeLoading
                    ? 0.65
                    : 1,
              }}
            >
              {liked
                ? "♥ Liked"
                : "♡ Like"}{" "}
              ({likeCount})
            </button>

            <button
              type="button"
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              aria-label={
                bookmarked
                  ? "Remove bookmark"
                  : "Bookmark this writing"
              }
              aria-pressed={bookmarked}
              style={{
                appearance:
                  "none",
                border:
                  "1px solid #d9c9d5",
                background:
                  bookmarked
                    ? "#f1e4ed"
                    : "#fff",
                color:
                  "#674f64",
                padding:
                  "12px 22px",
                borderRadius:
                  "4px",
                cursor:
                  bookmarkLoading
                    ? "wait"
                    : "pointer",
                fontSize:
                  "14px",
                transition:
                  "all 0.2s ease",
                opacity:
                  bookmarkLoading
                    ? 0.65
                    : 1,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={
                    bookmarked
                      ? "currentColor"
                      : "none"
                  }
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z" />
                </svg>
                {bookmarked ? "Saved" : "Save"}
              </span>
            </button>
          </div>

          {/* =================================================
              GOOGLE LOGIN
          ================================================= */}

          {showGoogleLogin && (
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "center",
                marginTop:
                  "20px",
                marginBottom:
                  "35px",
              }}
            >
              <div
                style={{
                  width:
                    "100%",
                  maxWidth:
                    "380px",
                  background:
                    "#fff",
                  border:
                    "1px solid #e3d6df",
                  padding:
                    "25px",
                  textAlign:
                    "center",
                  boxShadow:
                    "0 10px 30px rgba(60,40,55,0.08)",
                }}
              >
                <div
                  style={{
                    fontFamily:
                      "Georgia, 'Times New Roman', serif",
                    fontSize:
                      "21px",
                    color:
                      "#342332",
                    marginBottom:
                      "8px",
                  }}
                >
                  Sign in to continue
                </div>

                <p
                  style={{
                    margin:
                      "0 0 20px",
                    color:
                      "#806b7b",
                    fontSize:
                      "13px",
                    lineHeight:
                      1.6,
                  }}
                >
                  Continue with Google to
                  like, comment, reply, or save.
                </p>

                {googleLoginError && (
                  <div
                    style={{
                      background:
                        "#fff0f1",
                      border:
                        "1px solid #ead1d5",
                      color:
                        "#955c67",
                      padding:
                        "10px 12px",
                      marginBottom:
                        "15px",
                      fontSize:
                        "12px",
                      lineHeight:
                        1.5,
                    }}
                  >
                    {
                      googleLoginError
                    }
                  </div>
                )}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "center",
                  }}
                >
                  <GoogleLogin
                    onSuccess={(
                      response
                    ) => {
                      if (
                        response.credential
                      ) {
                        handleGoogleLoginSuccess(
                          response.credential
                        );
                      } else {
                        setGoogleLoginError(
                          "Google did not return a credential."
                        );
                      }
                    }}
                    onError={() => {
                      setGoogleLoginError(
                        "Google sign-in was cancelled or failed."
                      );
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleLogin(
                      false
                    );
                    setGoogleLoginError(
                      ""
                    );
                    setPendingCommentParentId(
                      null
                    );
                    setPendingBookmark(false);
                  }}
                  style={{
                    marginTop:
                      "15px",
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      "#947c8d",
                    cursor:
                      "pointer",
                    fontSize:
                      "12px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              COMMENTS
          ================================================= */}

          <section
            style={{
              maxWidth:
                "760px",
              margin:
                "70px auto 0",
              paddingTop:
                "35px",
              borderTop:
                "1px solid #dfd2db",
            }}
          >
            {/* COMMENTS HEADING */}

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "baseline",
                justifyContent:
                  "space-between",
                gap:
                  "20px",
                marginBottom:
                  "28px",
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      "#947c8d",
                    fontSize:
                      "11px",
                    letterSpacing:
                      "0.15em",
                    textTransform:
                      "uppercase",
                    marginBottom:
                      "7px",
                  }}
                >
                  Conversation
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontFamily:
                      "Georgia, 'Times New Roman', serif",
                    fontSize:
                      "30px",
                    fontWeight:
                      400,
                    color:
                      "#342332",
                  }}
                >
                  Comments
                </h2>
              </div>

              <span
                style={{
                  color:
                    "#947c8d",
                  fontSize:
                    "12px",
                }}
              >
                {comments.length}{" "}
                {comments.length ===
                1
                  ? "comment"
                  : "comments"}
              </span>
            </div>

            {/* NEW COMMENT */}

            <div
              style={{
                background:
                  "#fff",
                border:
                  "1px solid #e5d9e1",
                padding:
                  "20px",
                marginBottom:
                  "35px",
              }}
            >
              <textarea
                value={
                  commentText
                }
                onChange={(
                  event
                ) =>
                  setCommentText(
                    event.target
                      .value
                  )
                }
                onFocus={
                  handleCommentBoxClick
                }
                placeholder="Write something..."
                rows={4}
                maxLength={5000}
                style={{
                  width:
                    "100%",
                  boxSizing:
                    "border-box",
                  resize:
                    "vertical",
                  border:
                    "1px solid #ded1da",
                  background:
                    "#fff",
                  color:
                    "#443444",
                  padding:
                    "13px",
                  fontFamily:
                    "inherit",
                  fontSize:
                    "14px",
                  lineHeight:
                    1.65,
                  outline:
                    "none",
                }}
              />

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap:
                    "15px",
                  marginTop:
                    "10px",
                }}
              >
                <span
                  style={{
                    color:
                      "#a18e9c",
                    fontSize:
                      "11px",
                  }}
                >
                  {commentText.length}
                  /5000
                </span>

                <button
                  type="button"
                  disabled={
                    commentSubmitting ||
                    !commentText.trim()
                  }
                  onClick={() =>
                    submitComment(
                      null
                    )
                  }
                  style={{
                    border:
                      "1px solid #8b6b84",
                    background:
                      "#674f64",
                    color:
                      "#fff",
                    padding:
                      "10px 18px",
                    cursor:
                      "pointer",
                    fontSize:
                      "12px",
                    opacity:
                      commentSubmitting ||
                      !commentText.trim()
                        ? 0.5
                        : 1,
                  }}
                >
                  {commentSubmitting
                    ? "Posting..."
                    : "Post comment"}
                </button>
              </div>
            </div>

            {/* ERROR */}

            {commentsError && (
              <div
                style={{
                  background:
                    "#fff0f1",
                  border:
                    "1px solid #ead1d5",
                  color:
                    "#955c67",
                  padding:
                    "12px 15px",
                  marginBottom:
                    "25px",
                  fontSize:
                    "13px",
                }}
              >
                {commentsError}
              </div>
            )}

            {/* LOADING */}

            {commentsLoading && (
              <div
                style={{
                  textAlign:
                    "center",
                  color:
                    "#947c8d",
                  fontSize:
                    "13px",
                  padding:
                    "25px",
                }}
              >
                Loading comments...
              </div>
            )}

            {/* EMPTY */}

            {!commentsLoading &&
              comments.length ===
                0 && (
                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "35px 20px",
                    color:
                      "#947c8d",
                    fontFamily:
                      "Georgia, 'Times New Roman', serif",
                    fontStyle:
                      "italic",
                    fontSize:
                      "15px",
                  }}
                >
                  No comments yet.
                  <br />
                  Be the first to say
                  something.
                </div>
              )}

            {/* COMMENT LIST */}

            {!commentsLoading &&
              rootComments.length >
                0 && (
                <div>
                  {rootComments.map(
                    (comment) =>
                      renderComment(
                        comment
                      )
                  )}
                </div>
              )}
          </section>

          {/* =================================================
              TAGS
          ================================================= */}

          {writing.tags &&
            writing.tags.length >
              0 && (
              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "8px",
                  marginTop:
                    "55px",
                  paddingTop:
                    "25px",
                  borderTop:
                    "1px solid #e3d6df",
                }}
              >
                {writing.tags.map(
                  (tag) => (
                    <span
                      key={
                        tag.id
                      }
                      style={{
                        border:
                          "1px solid #dfd1dc",
                        background:
                          "#fff",
                        color:
                          "#806f7c",
                        padding:
                          "7px 11px",
                        borderRadius:
                          "3px",
                        fontSize:
                          "12px",
                      }}
                    >
                      #{tag.name}
                    </span>
                  )
                )}
              </div>
            )}

          {/* =================================================
              BACK
          ================================================= */}

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "center",
              marginTop:
                "65px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setLocation("/")
              }
              style={{
                border:
                  "1px solid #d9c9d5",
                background:
                  "#fff",
                color:
                  "#674f64",
                padding:
                  "13px 22px",
                borderRadius:
                  "3px",
                cursor:
                  "pointer",
                fontSize:
                  "13px",
              }}
            >
              ← Back to writings
            </button>
          </div>
        </article>
      </main>

      {/* =================================================
          ARTICLE STYLES
      ================================================= */}

      <style>
        {`
          .public-writing-content {
            max-width: 760px;
            margin: 0 auto;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 18px;
            line-height: 1.9;
            color: #443444;
          }

          .public-writing-content p {
            margin: 0 0 1.35em;
          }

          .public-writing-content h1,
          .public-writing-content h2,
          .public-writing-content h3 {
            font-family: Georgia, "Times New Roman", serif;
            font-weight: 400;
            color: #382937;
          }

          .public-writing-content h1 {
            font-size: 38px;
            line-height: 1.2;
            margin: 1.5em 0 0.65em;
          }

          .public-writing-content h2 {
            font-size: 30px;
            line-height: 1.25;
            margin: 1.5em 0 0.65em;
          }

          .public-writing-content h3 {
            font-size: 24px;
            line-height: 1.3;
            margin: 1.4em 0 0.6em;
          }

          .public-writing-content strong {
            font-weight: 700;
          }

          .public-writing-content em {
            font-style: italic;
          }

          .public-writing-content blockquote {
            border-left: 3px solid #cbaac2;
            margin: 2em 0;
            padding: 5px 0 5px 25px;
            color: #806b7b;
            font-style: italic;
          }

          .public-writing-content ul,
          .public-writing-content ol {
            margin: 1.2em 0;
            padding-left: 32px;
          }

          .public-writing-content li {
            margin-bottom: 0.45em;
          }

          .public-writing-content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 35px auto;
          }

          .public-writing-content a {
            color: #936580;
            text-decoration: underline;
            text-underline-offset: 3px;
          }

          .public-writing-content a:hover {
            opacity: 0.75;
          }

          .public-writing-content hr {
            border: none;
            border-top: 1px solid #e3d6df;
            margin: 45px 0;
          }

          .public-writing-content code {
            background: #f1eaf0;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 0.9em;
          }

          .public-writing-content pre {
            background: #f1eaf0;
            padding: 20px;
            overflow-x: auto;
            border-radius: 4px;
            margin: 1.5em 0;
          }

          .public-writing-content pre code {
            background: transparent;
            padding: 0;
          }

          @media (max-width: 700px) {
  .public-writing-content {
    font-size: 16px;
    line-height: 1.65;
  }

  .public-writing-content h1 {
    font-size: 28px;
    line-height: 1.05;
  }

  .public-writing-content h2 {
    font-size: 24px;
    line-height: 1.15;
  }

  .public-writing-content h3 {
    font-size: 20px;
    line-height: 1.2;
  }

  /* Mobile writing header */
  article h1[style] {
    font-size: 28px !important;
    line-height: 1.08 !important;
    max-width: 100% !important;
    margin-bottom: 20px !important;
  }

  article p[style] {
    font-size: 16px !important;
    line-height: 1.55 !important;
    margin-bottom: 32px !important;
  }

  article figure {
    margin-bottom: 40px !important;
  }

  article figure img {
    width: 82% !important;
    max-height: 360px !important;
    height: auto !important;
    margin: 0 auto !important;
    object-fit: cover;
  }

  article {
    padding-left: 18px !important;
    padding-right: 18px !important;
  }
}
        `}
      </style>
    </div>
  );
}