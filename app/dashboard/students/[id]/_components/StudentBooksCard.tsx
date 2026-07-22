import { BookOpen, CheckCircle, XCircle } from "lucide-react";
import { Student, BookDef } from "@/lib/types";

interface Props {
  student: Student;
  books: BookDef[];
  onToggleBook: (bookId: string) => void;
}

export function StudentBooksCard({ student, books, onToggleBook }: Props) {
  if (books.length === 0) return null;
  const receivedCount = books.filter((b) => student.received_books?.includes(b.id)).length;

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title">
        <BookOpen size={16} style={{ color: "var(--color-teal)" }} />
        <span>الكتب والمذكرات</span>
        <span style={{ marginRight: "auto", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 400 }}>
          {receivedCount}/{books.length} مستلم
        </span>
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {books.map((book) => {
          const received = student.received_books?.includes(book.id);
          return (
            <button
              key={book.id}
              onClick={() => onToggleBook(book.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.7rem 1rem", borderRadius: "10px",
                border: `1px solid ${received ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.07)"}`,
                background: received ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)",
                cursor: "pointer", color: "#fff", transition: "all 0.2s", textAlign: "right",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BookOpen size={14} style={{ color: received ? "#10b981" : "var(--text-muted)" }} />
                <span style={{ fontSize: "0.9rem" }}>{book.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{book.price} جنيه</span>
                {received
                  ? <CheckCircle size={16} style={{ color: "#10b981" }} />
                  : <XCircle size={16} style={{ color: "rgba(255,255,255,0.15)" }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
