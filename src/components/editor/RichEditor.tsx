"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { useCallback, useEffect } from "react";

interface RichEditorProps {
  content: object | null;
  onChange?: (json: object) => void;
  readOnly?: boolean;
  placeholder?: string;
}

const COLORS = ["#1a1a1a","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#6b7280"];

export default function RichEditor({ content, onChange, readOnly = false, placeholder }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: readOnly }),
      Placeholder.configure({ placeholder: placeholder ?? "Écrivez le contenu du cours..." }),
      Youtube.configure({ controls: true, nocookie: true }),
    ],
    content: content ?? undefined,
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange?.(editor.getJSON());
    },
  });

  // Sync content when it changes externally (loading saved content)
  useEffect(() => {
    if (!editor || !content) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(content);
    if (current !== incoming) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addYoutube = useCallback(() => {
    const url = prompt("URL YouTube :");
    if (url && editor) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes("link").href as string | undefined;
    const url = prompt("URL du lien :", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  if (readOnly) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <EditorContent editor={editor} />
      </div>
    );
  }

  const btn = (active: boolean, onClick: () => void, children: React.ReactNode, title?: string) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 dark:border-gray-700 px-2 py-1.5 bg-gray-50 dark:bg-gray-800">
        {/* Headings */}
        {btn(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "H1")}
        {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2")}
        {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3")}
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        {/* Bold / Italic / Strike / Code */}
        {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <b>G</b>, "Gras")}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <i>I</i>, "Italique")}
        {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), <s>S</s>, "Barré")}
        {btn(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <code className="font-mono">{"`"}</code>, "Code")}
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        {/* Lists */}
        {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "• Liste", "Liste à puces")}
        {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "1. Liste", "Liste numérotée")}
        {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "❝", "Citation")}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), "—", "Séparateur")}
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        {/* Colors */}
        <span className="text-xs text-gray-400 dark:text-gray-500 px-1">Couleur :</span>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => editor.chain().focus().setColor(c).run()}
            className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 shadow-sm hover:scale-110 transition-transform"
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        {/* Highlight */}
        {btn(editor.isActive("highlight"), () => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run(), "🖊 Surligner", "Surligner")}
        {/* Link */}
        {btn(editor.isActive("link"), setLink, "🔗 Lien", "Insérer un lien")}
        {/* YouTube */}
        {btn(false, addYoutube, "▶ YouTube", "Intégrer une vidéo YouTube")}
        <div className="flex-1" />
        {/* Code block */}
        {btn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), <span className="font-mono text-xs">{"</>"}</span>, "Bloc de code")}
        {btn(false, () => editor.chain().focus().clearNodes().unsetAllMarks().run(), "✕ Effacer", "Effacer le formatage")}
      </div>

      {/* Editor area */}
      <div className="min-h-[300px] px-4 py-3">
        <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[250px]" />
      </div>
    </div>
  );
}
