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
    <div className="rich-text-editor flex flex-col w-full rounded-md border border-[var(--border-color)] overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 bg-[rgba(255,255,255,0.02)] border-b border-[var(--border-color)]">
        <button
          onClick={toggleBold}
          className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-[var(--color-teal)] text-white' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
          title="عريض"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={toggleItalic}
          className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-[var(--color-teal)] text-white' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
          title="مائل"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={toggleUnderline}
          className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-[var(--color-teal)] text-white' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
          title="تسطير"
        >
          <UnderlineIcon size={16} />
        </button>
        
        <div className="w-[1px] h-6 bg-[var(--border-color)] mx-1 self-center" />
        
        <button
          onClick={toggleAlignRight}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-[var(--color-teal)] text-white' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
          title="محاذاة لليمين"
        >
          <AlignRight size={16} />
        </button>
        <button
          onClick={toggleAlignCenter}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-[var(--color-teal)] text-white' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
          title="محاذاة للوسط"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={toggleAlignLeft}
          className={`p-1.5 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-[var(--color-teal)] text-white' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
          title="محاذاة لليسار"
        >
          <AlignLeft size={16} />
        </button>

        <div className="w-[1px] h-6 bg-[var(--border-color)] mx-1 self-center" />

        <button
          onClick={toggleBulletList}
          className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-[var(--color-teal)] text-white' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
          title="قائمة نقطية"
        >
          <List size={16} />
        </button>
        <button
          onClick={toggleOrderedList}
          className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-[var(--color-teal)] text-white' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
          title="قائمة رقمية"
        >
          <ListOrdered size={16} />
        </button>
      </div>
      
      <EditorContent editor={editor} />
      
      <style jsx global>{`
        .ProseMirror p {
          margin: 0;
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
