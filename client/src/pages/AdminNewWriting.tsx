import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useLocation } from "wouter";



const API_BASE_URL = "https://theunfilteredarchives-blog.onrender.com";
function compressImageToDataUrl(
  file: File,
  maxWidth = 1600,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read image."));
        return;
      }

      const image = new window.Image();

      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Unable to process image."));
          return;
        }

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const compressed = canvas.toDataURL(
          "image/jpeg",
          quality
        );

        resolve(compressed);
      };

      image.onerror = () => {
        reject(new Error("Unable to load image."));
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("Unable to read image."));
    };

    reader.readAsDataURL(file);
  });
}

export default function AdminNewWriting() {
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [featured, setFeatured] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder: "Start writing whatever is on your mind...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "writing-editor-content",
      },

      handlePaste(view, event) {
        const clipboardItems = Array.from(event.clipboardData?.items ?? []);
        const imageItems = clipboardItems.filter((item) =>
          item.type.startsWith("image/")
        );

        if (!imageItems.length || !editor) {
          return false;
        }

        event.preventDefault();

        imageItems.forEach((item) => {
          const file = item.getAsFile();

          if (!file) return;

          compressImageToDataUrl(file)
  .then((compressedImage) => {
    editor
      .chain()
      .focus()
      .setImage({
        src: compressedImage,
        alt: title || "Writing image",
      })
      .run();
  })
  .catch(() => {
    setError(
      "Unable to insert that image. Please try another file."
    );
  });
        });

        return true;
      },
    },
  });

  /*
   * Cover image can be pasted directly or selected from the device.
   * It is stored as a data URL and requires cover_image_url to be TEXT
   * in PostgreSQL because a base64 image is larger than VARCHAR(1000).
   */
  function handleCoverImageFile(file: File | null) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("Please select an image file.");
    return;
  }

  compressImageToDataUrl(file)
    .then((compressedImage) => {
      setCoverImageUrl(compressedImage);
      setError("");
    })
    .catch(() => {
      setError(
        "Unable to insert that cover image. Please try another file."
      );
    });
}

  function handleCoverImagePaste(
    event: React.ClipboardEvent<HTMLDivElement>
  ) {
    const items = Array.from(event.clipboardData.items);
    const imageItem = items.find((item) =>
      item.type.startsWith("image/")
    );

    if (!imageItem) return;

    event.preventDefault();
    handleCoverImageFile(imageItem.getAsFile());
  }

  function handleCoverImageInput(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    handleCoverImageFile(file);
  }

  /*
   * Insert an image into the article using the device file picker.
   * Images are converted to data URLs so they remain part of the
   * existing writing HTML payload and do not require an image URL.
   */
  function addImage() {
    if (!editor) return;
    imageInputRef.current?.click();
  }

  function handleImageFile(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  // Allow selecting the same image again later.
  event.target.value = "";

  if (!file || !editor) return;

  if (!file.type.startsWith("image/")) {
    setError("Please select an image file.");
    return;
  }

  compressImageToDataUrl(file)
    .then((compressedImage) => {
      editor
        .chain()
        .focus()
        .setImage({
          src: compressedImage,
          alt: title || "Writing image",
        })
        .run();
    })
    .catch(() => {
      setError(
        "Unable to insert that image. Please try another file."
      );
    });
}
  /*
   * Add a link.
   */
  function addLink() {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;

    const url = window.prompt(
      "Enter the URL:",
      previousUrl || "https://"
    );

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  /*
   * Submit writing.
   */
  async function submitWriting(status: "DRAFT" | "PUBLISHED") {
    const token =
      localStorage.getItem("admin_access_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("admin_token") ||
      localStorage.getItem("adminToken");

    if (!token) {
      setError("Your admin session is missing. Please log in again.");
      return;
    }

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!editor) {
      setError("The writing editor is not ready yet.");
      return;
    }

    const content = editor.getHTML();

    if (!content || content === "<p></p>") {
      setError("Please write something before saving.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
        status,
        featured,
      };

      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        30000
      );

      let response: Response;

      try {
        response = await fetch(
          `${API_BASE_URL}/api/writings`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          }
        );
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("jwt");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin_user");
        setLocation("/admin/login");
        return;
      }

      const responseText = await response.text();

      let responseData: any = null;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        const backendMessage =
          responseData?.detail ||
          responseText ||
          "Failed to save the writing.";

        throw new Error(
          typeof backendMessage === "string"
            ? backendMessage
            : "Failed to save the writing."
        );
      }

      setSuccess(
        status === "PUBLISHED"
          ? "Writing published successfully."
          : "Draft saved successfully."
      );

      /*
       * After a successful save, return to the writing manager.
       */
      setTimeout(() => {
        setLocation("/admin/writings");
      }, 700);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? "The server took too long to respond. Please check that the backend is running."
          : err instanceof TypeError && err.message === "Failed to fetch"
            ? "Cannot reach the backend at https://theunfilteredarchives-blog.onrender.com. Start the FastAPI backend and enable CORS for the frontend."
            : err instanceof Error
              ? err.message
              : "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("adminToken");
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
          <button
            type="button"
            onClick={() => setLocation("/admin")}
            style={navButtonStyle(false)}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => setLocation("/admin/writings")}
            style={navButtonStyle(true)}
          >
            Writings
          </button>

          <button
            type="button"
            onClick={() => setLocation("/admin/comments")}
            style={navButtonStyle(false)}
          >
            Comments
          </button>

          <button
            type="button"
            onClick={() => setLocation("/admin/users")}
            style={navButtonStyle(false)}
          >
            Users
          </button>

          <button
            type="button"
            onClick={() => setLocation("/admin/reports")}
            style={navButtonStyle(false)}
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

      {/* Main */}
      <main
        style={{
          flex: 1,
          padding: "48px",
          maxWidth: "1100px",
          boxSizing: "border-box",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "36px",
            gap: "20px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#8b7187",
              }}
            >
              Writings
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: "38px",
                fontWeight: 400,
                letterSpacing: "-0.03em",
              }}
            >
              New Writing
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setLocation("/admin/writings")}
            style={{
              border: "1px solid #dcd2da",
              background: "#fff",
              color: "#594454",
              padding: "11px 16px",
              cursor: "pointer",
              fontSize: "11px",
              borderRadius: "2px",
            }}
          >
            ← Back to writings
          </button>
        </header>

        {/* Messages */}
        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              background: "#fbefef",
              color: "#a24d5a",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              background: "#edf5ee",
              color: "#55745c",
              fontSize: "13px",
            }}
          >
            {success}
          </div>
        )}

        {/* Basic information */}
        <section style={sectionStyle}>
          <label style={labelStyle}>Title</label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Give your writing a title..."
            style={largeInputStyle}
          />

          <label style={{ ...labelStyle, marginTop: "26px" }}>
            Excerpt
          </label>

          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="A short description that will appear with the writing..."
            rows={3}
            style={textareaStyle}
          />

          <label style={{ ...labelStyle, marginTop: "26px" }}>
            Cover image
          </label>

          <input
            ref={coverImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverImageInput}
            style={{ display: "none" }}
          />

          <div
            onPaste={handleCoverImagePaste}
            onClick={() => coverImageInputRef.current?.click()}
            tabIndex={0}
            style={{
              border: "1px dashed #dcd2da",
              background: "#fff",
              minHeight: "120px",
              padding: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {coverImageUrl ? (
              <div style={{ width: "100%" }}>
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: "320px",
                    objectFit: "cover",
                    borderRadius: "2px",
                  }}
                />
                <p
                  style={{
                    margin: "12px 0 0",
                    fontSize: "12px",
                    color: "#8b7187",
                  }}
                >
                  Click to replace the cover image
                </p>
              </div>
            ) : (
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#594454",
                  }}
                >
                  Paste your cover image here
                </p>
                <p
                  style={{
                    margin: "7px 0 0",
                    fontSize: "12px",
                    color: "#9a8d96",
                  }}
                >
                  Or click to choose an image from your device
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Editor */}
        <section style={sectionStyle}>
          <label style={labelStyle}>Your writing</label>

          <div
            style={{
              border: "1px solid #dcd2da",
              background: "#fff",
            }}
          >
            {/* Toolbar */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFile}
              style={{ display: "none" }}
            />

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                padding: "10px",
                borderBottom: "1px solid #e8dfe6",
              }}
            >
              <ToolbarButton
                label="B"
                active={editor?.isActive("bold")}
                onClick={() =>
                  editor?.chain().focus().toggleBold().run()
                }
              />

              <ToolbarButton
                label="I"
                active={editor?.isActive("italic")}
                onClick={() =>
                  editor?.chain().focus().toggleItalic().run()
                }
              />

              <ToolbarButton
                label="H1"
                active={editor?.isActive("heading", { level: 1 })}
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .toggleHeading({ level: 1 })
                    .run()
                }
              />

              <ToolbarButton
                label="H2"
                active={editor?.isActive("heading", { level: 2 })}
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .toggleHeading({ level: 2 })
                    .run()
                }
              />

              <ToolbarButton
                label="Quote"
                active={editor?.isActive("blockquote")}
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .toggleBlockquote()
                    .run()
                }
              />

              <ToolbarButton
                label="• List"
                active={editor?.isActive("bulletList")}
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .toggleBulletList()
                    .run()
                }
              />

              <ToolbarButton
                label="1. List"
                active={editor?.isActive("orderedList")}
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .toggleOrderedList()
                    .run()
                }
              />

              <ToolbarButton
                label="Link"
                active={editor?.isActive("link")}
                onClick={addLink}
              />

              <ToolbarButton
                label="Image"
                onClick={addImage}
              />

              <ToolbarButton
                label="Undo"
                onClick={() =>
                  editor?.chain().focus().undo().run()
                }
              />

              <ToolbarButton
                label="Redo"
                onClick={() =>
                  editor?.chain().focus().redo().run()
                }
              />
            </div>

            <EditorContent editor={editor} />
          </div>

          <p
            style={{
              margin: "10px 0 0",
              fontSize: "12px",
              color: "#9a8d96",
            }}
          >
            Paste an image directly into your writing, or use Image to choose one from your device.
          </p>
        </section>

        {/* Options */}
        <section style={sectionStyle}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#594454",
            }}
          >
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) =>
                setFeatured(event.target.checked)
              }
            />

            Feature this writing
          </label>
        </section>

        {/* Actions */}
        <section
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            paddingBottom: "50px",
          }}
        >
          <button
            type="button"
            disabled={saving}
            onClick={() => submitWriting("DRAFT")}
            style={{
              border: "1px solid #dcd2da",
              background: "#fff",
              color: "#594454",
              padding: "13px 20px",
              borderRadius: "2px",
              cursor: saving ? "wait" : "pointer",
              fontSize: "12px",
              letterSpacing: "0.05em",
            }}
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => submitWriting("PUBLISHED")}
            style={{
              border: "none",
              background: "#594454",
              color: "#fff",
              padding: "13px 22px",
              borderRadius: "2px",
              cursor: saving ? "wait" : "pointer",
              fontSize: "12px",
              letterSpacing: "0.05em",
            }}
          >
            {saving ? "Publishing..." : "Publish"}
          </button>
        </section>
      </main>

      {/* Editor styles */}
      <style>{`
        .writing-editor-content {
          min-height: 420px;
          padding: 28px;
          outline: none;
          font-family: inherit;
          font-size: 17px;
          line-height: 1.85;
          color: #423842;
        }

        .writing-editor-content p {
          margin: 0 0 1.2em;
        }

        .writing-editor-content h1 {
          font-size: 34px;
          line-height: 1.2;
          font-weight: 500;
          margin: 1em 0 0.6em;
        }

        .writing-editor-content h2 {
          font-size: 27px;
          line-height: 1.3;
          font-weight: 500;
          margin: 1em 0 0.6em;
        }

        .writing-editor-content blockquote {
          margin: 24px 0;
          padding: 12px 22px;
          border-left: 3px solid #c9a9c2;
          color: #756573;
          font-style: italic;
        }

        .writing-editor-content ul,
        .writing-editor-content ol {
          padding-left: 28px;
        }

        .writing-editor-content a {
          color: #795d75;
          text-decoration: underline;
        }

        .writing-editor-content img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 24px auto;
          border-radius: 3px;
        }

        .writing-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #b2a5af;
          float: left;
          height: 0;
          pointer-events: none;
        }

        .writing-editor-content:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}

function ToolbarButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active
          ? "1px solid #594454"
          : "1px solid transparent",
        background: active ? "#f3eaf1" : "transparent",
        color: "#594454",
        padding: "7px 9px",
        borderRadius: "2px",
        cursor: "pointer",
        fontSize: "11px",
      }}
    >
      {label}
    </button>
  );
}

const sectionStyle = {
  background: "#fff",
  border: "1px solid #e8dfe6",
  padding: "28px",
  marginBottom: "18px",
};

const labelStyle = {
  display: "block",
  marginBottom: "9px",
  fontSize: "11px",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "#8b7187",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #dcd2da",
  background: "#fff",
  color: "#342b35",
  padding: "13px 14px",
  borderRadius: "2px",
  fontSize: "14px",
  outline: "none",
};

const largeInputStyle = {
  ...inputStyle,
  fontSize: "22px",
  padding: "16px",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical" as const,
  lineHeight: 1.6,
};

const mutedTextStyle = {
  margin: 0,
  color: "#9a8d96",
  fontSize: "13px",
};

const navButtonStyle = (active: boolean) => ({
  width: "100%",
  textAlign: "left" as const,
  border: "none",
  background: active ? "#f3eaf1" : "transparent",
  color: active ? "#594454" : "#7b6b78",
  padding: "12px 14px",
  cursor: "pointer",
  fontSize: "13px",
  borderRadius: "2px",
});