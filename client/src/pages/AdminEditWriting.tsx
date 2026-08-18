
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";

/* =======================================================
   AUTH
======================================================= */

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

function getAuthHeaders(): HeadersInit {
  const token = getToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
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
  id: number | string;
  title?: string;
  content?: string | null;
  excerpt?: string | null;
  cover_image_url?: string | null;
  category_id?: number | string | null;
  tag_ids?: Array<number | string>;
  tags?: Array<number | string | { id: number | string }>;
  status?: string | null;
  featured?: boolean;
};

/* =======================================================
   EDITOR TOOLBAR
======================================================= */

function EditorToolbar({
  editor,
}: {
  editor: ReturnType<typeof useEditor>;
}) {
  if (!editor) {
    return null;
  }

  const buttonStyle = (
    active = false
  ): React.CSSProperties => ({
    border: "none",
    background: active ? "#eee2eb" : "transparent",
    color: "#654e61",
    padding: "8px 10px",
    cursor: "pointer",
    borderRadius: "3px",
    fontSize: "13px",
  });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        padding: "10px",
        borderBottom: "1px solid #eadfe7",
        background: "#fcfafc",
      }}
    >
      <button
        type="button"
        onClick={() =>
          editor.chain().focus().toggleBold().run()
        }
        style={buttonStyle(editor.isActive("bold"))}
      >
        <strong>B</strong>
      </button>

      <button
        type="button"
        onClick={() =>
          editor.chain().focus().toggleItalic().run()
        }
        style={buttonStyle(editor.isActive("italic"))}
      >
        <em>I</em>
      </button>

      <button
        type="button"
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({ level: 2 })
            .run()
        }
        style={buttonStyle(
          editor.isActive("heading", { level: 2 })
        )}
      >
        H2
      </button>

      <button
        type="button"
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({ level: 3 })
            .run()
        }
        style={buttonStyle(
          editor.isActive("heading", { level: 3 })
        )}
      >
        H3
      </button>

      <button
        type="button"
        onClick={() =>
          editor.chain().focus().toggleBulletList().run()
        }
        style={buttonStyle(
          editor.isActive("bulletList")
        )}
      >
        • List
      </button>

      <button
        type="button"
        onClick={() =>
          editor.chain().focus().toggleOrderedList().run()
        }
        style={buttonStyle(
          editor.isActive("orderedList")
        )}
      >
        1. List
      </button>

      <button
        type="button"
        onClick={() =>
          editor.chain().focus().toggleBlockquote().run()
        }
        style={buttonStyle(
          editor.isActive("blockquote")
        )}
      >
        Quote
      </button>

      <button
        type="button"
        onClick={() =>
          editor.chain().focus().setHorizontalRule().run()
        }
        style={buttonStyle()}
      >
        —
      </button>

      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Enter image URL");

          if (url) {
            editor
              .chain()
              .focus()
              .setImage({ src: url })
              .run();
          }
        }}
        style={buttonStyle()}
      >
        Image
      </button>

      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Enter link URL");

          if (!url) {
            return;
          }

          editor
            .chain()
            .focus()
            .setLink({
              href: url,
              target: "_blank",
            })
            .run();
        }}
        style={buttonStyle(editor.isActive("link"))}
      >
        Link
      </button>

      <button
        type="button"
        onClick={() =>
          editor.chain().focus().unsetLink().run()
        }
        style={buttonStyle()}
      >
        Unlink
      </button>
    </div>
  );
}

/* =======================================================
   MAIN PAGE
======================================================= */

export default function AdminEditWriting() {
  const [, setLocation] = useLocation();

  const [, params] = useRoute(
    "/admin/writings/:id/edit"
  );

  const writingId = params?.id;

  const [writing, setWriting] =
    useState<Writing | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [tags, setTags] = useState<Tag[]>([]);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [selectedTags, setSelectedTags] =
    useState<number[]>([]);

  const [featured, setFeatured] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =====================================================
     TIPTAP
  ===================================================== */

  const editor = useEditor({
    extensions: [
      StarterKit,

      Image.configure({
        allowBase64: true,
      }),

      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),

      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],

    content: "",
  });

  /* =====================================================
     LOAD CATEGORIES + TAGS
  ===================================================== */

  async function loadCatalog() {
    try {
      const [
        categoriesResponse,
        tagsResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/catalog/categories`
        ),
        fetch(
          `${API_BASE_URL}/api/catalog/tags`
        ),
      ]);

      if (categoriesResponse.ok) {
        const categoryData =
          await categoriesResponse.json();

        const categoryList = Array.isArray(
          categoryData
        )
          ? categoryData
          : categoryData?.categories || [];

        setCategories(categoryList);
      }

      if (tagsResponse.ok) {
        const tagData =
          await tagsResponse.json();

        const tagList = Array.isArray(tagData)
          ? tagData
          : tagData?.tags || [];

        setTags(tagList);
      }
    } catch (err) {
      console.error(
        "Catalog loading failed:",
        err
      );
    }
  }

  /* =====================================================
     EXTRACT WRITING LIST
  ===================================================== */

  function extractWritingList(data: any): Writing[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (
      Array.isArray(data?.writings)
    ) {
      return data.writings;
    }

    if (
      Array.isArray(data?.items)
    ) {
      return data.items;
    }

    if (
      Array.isArray(data?.data)
    ) {
      return data.data;
    }

    return [];
  }

  /* =====================================================
     NORMALIZE TAG IDS
  ===================================================== */

  function getTagIds(
    item: Writing
  ): number[] {
    if (Array.isArray(item.tag_ids)) {
      return item.tag_ids
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id));
    }

    if (Array.isArray(item.tags)) {
      return item.tags
        .map((tag) => {
          if (
            typeof tag === "number" ||
            typeof tag === "string"
          ) {
            return Number(tag);
          }

          return Number(tag.id);
        })
        .filter((id) => !Number.isNaN(id));
    }

    return [];
  }

  /* =====================================================
     LOAD EXISTING WRITING
  ===================================================== */

  async function loadWriting() {
    if (!writingId) {
      setError("Writing ID is missing.");
      setLoading(false);
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "No admin session found. Please log in again."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * IMPORTANT:
       * The backend does not expose
       * GET /api/writings/{id}.
       *
       * We therefore load the authenticated
       * admin writing list and find the requested
       * writing by ID.
       */

      const response = await fetch(
        `${API_BASE_URL}/api/writings/admin/all`,
        {
          method: "GET",
          headers: getAuthHeaders(),
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
          "You do not have permission to view writings."
        );

        return;
      }

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message ||
            "Failed to load writings."
        );
      }

      const responseData =
        await response.json();

      console.log(
        "Admin writings response:",
        responseData
      );

      const writings =
        extractWritingList(responseData);

      console.log(
        "Admin writings list:",
        writings
      );

      const currentWriting =
        writings.find(
          (item) =>
            Number(item.id) ===
            Number(writingId)
        );

      if (!currentWriting) {
        setError(
          `Writing #${writingId} was not found in the admin writing list.`
        );

        return;
      }

      console.log(
        "Editing writing:",
        currentWriting
      );

      setWriting(currentWriting);

      setTitle(
        currentWriting.title || ""
      );

      setExcerpt(
        currentWriting.excerpt || ""
      );

      setCoverImageUrl(
        currentWriting.cover_image_url ||
          ""
      );

      setCategoryId(
        currentWriting.category_id !==
          null &&
        currentWriting.category_id !==
          undefined
          ? String(
              currentWriting.category_id
            )
          : ""
      );

      setSelectedTags(
        getTagIds(currentWriting)
      );

      setFeatured(
        Boolean(currentWriting.featured)
      );

      /*
       * This is the important Tiptap part.
       * Existing HTML is inserted after the
       * writing has actually been found.
       */

      if (editor) {
        editor.commands.setContent(
          currentWriting.content || ""
        );
      }
    } catch (err) {
      console.error(
        "Failed to load writing:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load writing."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (!editor) {
      return;
    }

    loadWriting();
  }, [editor, writingId]);

  /* =====================================================
     TAG TOGGLE
  ===================================================== */

  function toggleTag(tagId: number) {
    setSelectedTags(
      (current) => {
        if (current.includes(tagId)) {
          return current.filter(
            (id) => id !== tagId
          );
        }

        return [...current, tagId];
      }
    );
  }

  /* =====================================================
     SAVE / PUBLISH
  ===================================================== */

  async function saveWriting(
    status: "DRAFT" | "PUBLISHED"
  ) {
    if (!writingId) {
      setError("Writing ID is missing.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "No admin session found. Please log in again."
      );
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!editor) {
      setError(
        "Editor is not ready."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const content =
        editor.getHTML();

      const payload = {
        title: title.trim(),

        content,

        excerpt:
          excerpt.trim() || null,

        cover_image_url:
          coverImageUrl.trim() || null,

        category_id: categoryId
          ? Number(categoryId)
          : null,

        tag_ids: selectedTags,

        status,

        featured,
      };

      console.log(
        "Updating writing:",
        writingId,
        payload
      );

      const response = await fetch(
        `${API_BASE_URL}/api/writings/${writingId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(
            payload
          ),
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
          "You do not have permission to update this writing."
        );

        return;
      }

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message ||
            "Failed to update writing."
        );
      }

      const updated =
        await response.json();

      /*
       * Some APIs return the updated writing
       * directly while others wrap it.
       */

      const updatedWriting =
        updated?.writing ||
        updated?.data ||
        updated;

      setWriting(
        updatedWriting
      );

      setSuccess(
        status === "PUBLISHED"
          ? "Writing published successfully."
          : "Draft saved successfully."
      );
    } catch (err) {
      console.error(
        "Save failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save writing."
      );
    } finally {
      setSaving(false);
    }
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
        }}
      >
        Loading writing...
      </div>
    );
  }

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
      {/* HEADER */}

      <header
        style={{
          background: "#fff",
          borderBottom:
            "1px solid #eadfe7",
          padding: "24px 45px",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "20px",
        }}
      >
        <div>
          <button
            type="button"
            onClick={() =>
              setLocation(
                "/admin/writings"
              )
            }
            style={{
              border: "none",
              background:
                "transparent",
              color: "#806a7b",
              cursor: "pointer",
              padding: 0,
              marginBottom:
                "12px",
              fontSize: "13px",
            }}
          >
            ← Back to writings
          </button>

          <h1
            style={{
              margin: 0,
              fontFamily:
                "Georgia, 'Times New Roman', serif",
              fontSize: "34px",
              fontWeight: 400,
              color: "#342332",
            }}
          >
            Edit Writing
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              saveWriting("DRAFT")
            }
            style={{
              border:
                "1px solid #d9c9d5",
              background: "#fff",
              color: "#674f64",
              padding:
                "13px 20px",
              borderRadius: "3px",
              cursor: saving
                ? "not-allowed"
                : "pointer",
              opacity: saving
                ? 0.6
                : 1,
            }}
          >
            {saving
              ? "Saving..."
              : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              saveWriting(
                "PUBLISHED"
              )
            }
            style={{
              border: "none",
              background:
                "#674f64",
              color: "#fff",
              padding:
                "13px 22px",
              borderRadius: "3px",
              cursor: saving
                ? "not-allowed"
                : "pointer",
              opacity: saving
                ? 0.6
                : 1,
            }}
          >
            {saving
              ? "Saving..."
              : "Publish"}
          </button>
        </div>
      </header>

      {/* MAIN */}

      <main
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding:
            "45px 30px 80px",
        }}
      >
        {error && (
          <div
            style={{
              background:
                "#fff0f1",
              border:
                "1px solid #ead1d5",
              color: "#955c67",
              padding:
                "15px 18px",
              marginBottom:
                "25px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background:
                "#edf6ef",
              border:
                "1px solid #d5e5d8",
              color: "#587b60",
              padding:
                "15px 18px",
              marginBottom:
                "25px",
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) 310px",
            gap: "30px",
            alignItems:
              "start",
          }}
        >
          {/* =================================================
              LEFT
          ================================================= */}

          <section>
            {/* TITLE */}

            <div
              style={{
                marginBottom:
                  "25px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontSize: "12px",
                  letterSpacing:
                    "0.12em",
                  color:
                    "#947c8d",
                  marginBottom:
                    "10px",
                }}
              >
                TITLE
              </label>

              <input
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="Your writing title"
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                  border:
                    "1px solid #e2d7e0",
                  background:
                    "#fff",
                  padding:
                    "17px 18px",
                  fontFamily:
                    "Georgia, 'Times New Roman', serif",
                  fontSize:
                    "28px",
                  color:
                    "#3e2d3c",
                  outline:
                    "none",
                }}
              />
            </div>

            {/* EXCERPT */}

            <div
              style={{
                marginBottom:
                  "25px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontSize:
                    "12px",
                  letterSpacing:
                    "0.12em",
                  color:
                    "#947c8d",
                  marginBottom:
                    "10px",
                }}
              >
                EXCERPT
              </label>

              <textarea
                value={excerpt}
                onChange={(e) =>
                  setExcerpt(
                    e.target.value
                  )
                }
                placeholder="A short description of this writing..."
                rows={3}
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                  resize:
                    "vertical",
                  border:
                    "1px solid #e2d7e0",
                  background:
                    "#fff",
                  padding:
                    "15px 18px",
                  fontFamily:
                    "inherit",
                  fontSize:
                    "14px",
                  lineHeight:
                    1.6,
                  color:
                    "#4d3b4a",
                  outline:
                    "none",
                }}
              />
            </div>

            {/* EDITOR */}

            <div
              style={{
                background:
                  "#fff",
                border:
                  "1px solid #e2d7e0",
              }}
            >
              <EditorToolbar
                editor={editor}
              />

              <EditorContent
                editor={editor}
              />
            </div>

            <style>
              {`
                .ProseMirror {
                  min-height: 500px;
                  padding: 28px;
                  outline: none;
                  font-family: Georgia, "Times New Roman", serif;
                  font-size: 17px;
                  line-height: 1.8;
                  color: #443444;
                }

                .ProseMirror p {
                  margin: 0 0 1.2em;
                }

                .ProseMirror h2 {
                  font-family: Georgia, "Times New Roman", serif;
                  font-weight: 400;
                  font-size: 28px;
                  margin: 1.4em 0 0.6em;
                  color: #382937;
                }

                .ProseMirror h3 {
                  font-family: Georgia, "Times New Roman", serif;
                  font-weight: 400;
                  font-size: 23px;
                  margin: 1.3em 0 0.5em;
                  color: #382937;
                }

                .ProseMirror blockquote {
                  border-left: 3px solid #cbaac2;
                  margin: 1.5em 0;
                  padding-left: 20px;
                  color: #806b7b;
                  font-style: italic;
                }

                .ProseMirror img {
                  max-width: 100%;
                  height: auto;
                  display: block;
                  margin: 25px auto;
                }

                .ProseMirror a {
                  color: #936580;
                  text-decoration: underline;
                }

                .ProseMirror ul,
                .ProseMirror ol {
                  padding-left: 28px;
                }

                .ProseMirror hr {
                  border: none;
                  border-top: 1px solid #e3d6df;
                  margin: 30px 0;
                }
              `}
            </style>
          </section>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside
            style={{
              background:
                "#fff",
              border:
                "1px solid #e2d7e0",
              padding: "25px",
            }}
          >
            {/* STATUS */}

            <div
              style={{
                marginBottom:
                  "28px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",
                  letterSpacing:
                    "0.12em",
                  color:
                    "#947c8d",
                  marginBottom:
                    "10px",
                }}
              >
                CURRENT STATUS
              </div>

              <div
                style={{
                  display:
                    "inline-block",
                  padding:
                    "9px 13px",
                  background:
                    writing?.status ===
                    "PUBLISHED"
                      ? "#edf5ee"
                      : "#f3eaf3",
                  color:
                    writing?.status ===
                    "PUBLISHED"
                      ? "#587b60"
                      : "#84677f",
                  fontSize:
                    "12px",
                  letterSpacing:
                    "0.08em",
                }}
              >
                {(
                  writing?.status ||
                  "DRAFT"
                ).toUpperCase()}
              </div>
            </div>

            {/* CATEGORY */}

            <div
              style={{
                marginBottom:
                  "28px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontSize:
                    "12px",
                  letterSpacing:
                    "0.12em",
                  color:
                    "#947c8d",
                  marginBottom:
                    "10px",
                }}
              >
                CATEGORY
              </label>

              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                  border:
                    "1px solid #e2d7e0",
                  background:
                    "#fff",
                  padding:
                    "12px",
                  color:
                    "#574353",
                  outline:
                    "none",
                }}
              >
                <option value="">
                  Select category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            {/* TAGS */}

            <div
              style={{
                marginBottom:
                  "28px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "12px",
                  letterSpacing:
                    "0.12em",
                  color:
                    "#947c8d",
                  marginBottom:
                    "12px",
                }}
              >
                TAGS
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap: "8px",
                }}
              >
                {tags.length ===
                0 ? (
                  <span
                    style={{
                      fontSize:
                        "13px",
                      color:
                        "#9a8995",
                    }}
                  >
                    No tags available
                  </span>
                ) : (
                  tags.map(
                    (tag) => {
                      const selected =
                        selectedTags.includes(
                          Number(
                            tag.id
                          )
                        );

                      return (
                        <button
                          type="button"
                          key={
                            tag.id
                          }
                          onClick={() =>
                            toggleTag(
                              Number(
                                tag.id
                              )
                            )
                          }
                          style={{
                            border:
                              "1px solid #dfd1dc",
                            background:
                              selected
                                ? "#eee1eb"
                                : "#fff",
                            color:
                              selected
                                ? "#654e61"
                                : "#806f7c",
                            padding:
                              "7px 10px",
                            borderRadius:
                              "3px",
                            cursor:
                              "pointer",
                            fontSize:
                              "12px",
                          }}
                        >
                          {
                            tag.name
                          }
                        </button>
                      );
                    }
                  )
                )}
              </div>
            </div>

            {/* COVER IMAGE */}

            <div
              style={{
                marginBottom:
                  "28px",
              }}
            >
              <label
                style={{
                  display:
                    "block",
                  fontSize:
                    "12px",
                  letterSpacing:
                    "0.12em",
                  color:
                    "#947c8d",
                  marginBottom:
                    "10px",
                }}
              >
                COVER IMAGE URL
              </label>

              <input
                value={
                  coverImageUrl
                }
                onChange={(e) =>
                  setCoverImageUrl(
                    e.target.value
                  )
                }
                placeholder="https://..."
                style={{
                  width: "100%",
                  boxSizing:
                    "border-box",
                  border:
                    "1px solid #e2d7e0",
                  background:
                    "#fff",
                  padding:
                    "12px",
                  color:
                    "#574353",
                  outline:
                    "none",
                  fontSize:
                    "13px",
                }}
              />

              {coverImageUrl && (
                <img
                  src={
                    coverImageUrl
                  }
                  alt="Cover preview"
                  style={{
                    width:
                      "100%",
                    marginTop:
                      "12px",
                    maxHeight:
                      "180px",
                    objectFit:
                      "cover",
                    display:
                      "block",
                  }}
                  onError={(
                    e
                  ) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />
              )}
            </div>

            {/* FEATURED */}

            <label
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "10px",
                cursor:
                  "pointer",
                color:
                  "#624f5e",
                fontSize:
                  "14px",
              }}
            >
              <input
                type="checkbox"
                checked={
                  featured
                }
                onChange={(e) =>
                  setFeatured(
                    e.target
                      .checked
                  )
                }
              />

              Feature this writing
            </label>
          </aside>
        </div>
      </main>
    </div>
  );
}

