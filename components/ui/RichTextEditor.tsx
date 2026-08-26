"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Bold, Italic, Underline as UnderlineIcon, AlignRight, AlignCenter, AlignLeft, List, ListOrdered } from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'right',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[100px] w-full p-3 bg-[rgba(255,255,255,0.05)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-b-md',
        style: 'direction: rtl; text-align: right;'
      },
    },
  });

  // Sync value if changed outside (like when editing a different question)
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const toggleBold = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); };
  const toggleItalic = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); };
  const toggleUnderline = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); };
  
  const toggleAlignRight = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); };
  const toggleAlignCenter = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); };
  const toggleAlignLeft = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); };

  const toggleBulletList = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); };
  const toggleOrderedList = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", borderRadius: "8px", border: "1px solid var(--border-color)", overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "8px", borderBottom: "1px solid var(--border-color)", background: "rgba(0,0,0,0.2)" }}>
        <button
          onClick={toggleBold}
          style={{ padding: "6px", borderRadius: "4px", cursor: "pointer", border: "none", background: editor.isActive('bold') ? "var(--color-teal)" : "transparent", color: editor.isActive('bold') ? "#fff" : "var(--text-secondary)" }}
          title="عريض"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={toggleItalic}
          style={{ padding: "6px", borderRadius: "4px", cursor: "pointer", border: "none", background: editor.isActive('italic') ? "var(--color-teal)" : "transparent", color: editor.isActive('italic') ? "#fff" : "var(--text-secondary)" }}
          title="مائل"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={toggleUnderline}
          style={{ padding: "6px", borderRadius: "4px", cursor: "pointer", border: "none", background: editor.isActive('underline') ? "var(--color-teal)" : "transparent", color: editor.isActive('underline') ? "#fff" : "var(--text-secondary)" }}
          title="تسطير"
        >
          <UnderlineIcon size={16} />
        </button>
        
        <div style={{ width: "1px", height: "24px", background: "var(--border-color)", margin: "0 4px", alignSelf: "center" }} />
        
        <button
          onClick={toggleAlignRight}
          style={{ padding: "6px", borderRadius: "4px", cursor: "pointer", border: "none", background: editor.isActive({ textAlign: 'right' }) ? "var(--color-teal)" : "transparent", color: editor.isActive({ textAlign: 'right' }) ? "#fff" : "var(--text-secondary)" }}
          title="محاذاة لليمين"
        >
          <AlignRight size={16} />
        </button>
        <button
          onClick={toggleAlignCenter}
          style={{ padding: "6px", borderRadius: "4px", cursor: "pointer", border: "none", background: editor.isActive({ textAlign: 'center' }) ? "var(--color-teal)" : "transparent", color: editor.isActive({ textAlign: 'center' }) ? "#fff" : "var(--text-secondary)" }}
          title="محاذاة للوسط"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={toggleAlignLeft}
          style={{ padding: "6px", borderRadius: "4px", cursor: "pointer", border: "none", background: editor.isActive({ textAlign: 'left' }) ? "var(--color-teal)" : "transparent", color: editor.isActive({ textAlign: 'left' }) ? "#fff" : "var(--text-secondary)" }}
          title="محاذاة لليسار"
        >
          <AlignLeft size={16} />
        </button>

        <div style={{ width: "1px", height: "24px", background: "var(--border-color)", margin: "0 4px", alignSelf: "center" }} />

        <button
          onClick={toggleBulletList}
          style={{ padding: "6px", borderRadius: "4px", cursor: "pointer", border: "none", background: editor.isActive('bulletList') ? "var(--color-teal)" : "transparent", color: editor.isActive('bulletList') ? "#fff" : "var(--text-secondary)" }}
          title="قائمة نقطية"
        >
          <List size={16} />
        </button>
        <button
          onClick={toggleOrderedList}
          style={{ padding: "6px", borderRadius: "4px", cursor: "pointer", border: "none", background: editor.isActive('orderedList') ? "var(--color-teal)" : "transparent", color: editor.isActive('orderedList') ? "#fff" : "var(--text-secondary)" }}
          title="قائمة رقمية"
        >
          <ListOrdered size={16} />
        </button>
      </div>
      
      <div style={{ padding: "12px", minHeight: "100px", color: "var(--text-primary)", outline: "none" }}>
        <EditorContent editor={editor} />
      </div>
      
      <style jsx global>{`
        .ProseMirror {
          outline: none !important;
          min-height: 100px;
        }
        .ProseMirror p {
          margin: 0 0 0.5rem 0;
          line-height: 1.6;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-right: 1.5rem;
          margin: 0.5rem 0;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-right: 1.5rem;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
