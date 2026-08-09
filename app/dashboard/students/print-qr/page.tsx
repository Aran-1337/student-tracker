"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ArrowRight, Download, CheckSquare, Square } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabaseClient";
import { StudentsService } from "@/lib/services/studentsService";
import { SystemSettingsService } from "@/lib/services/systemSettingsService";
import { GradesService } from "@/lib/services/gradesService";
import { GroupsService } from "@/lib/services/groupsService";
import { Student, Grade, Group } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

function PrintQRContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const gradeId = searchParams.get("gradeId") || "all";
  const groupId = searchParams.get("groupId") || "all";

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGradeId, setFilterGradeId] = useState(gradeId);
  const [filterGroupId, setFilterGroupId] = useState(groupId);
  const [allGradesList, setAllGradesList] = useState<Grade[]>([]);
  const [allGroupsList, setAllGroupsList] = useState<Group[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<Record<string, string>>({});
  const [siteLogo, setSiteLogo] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("Student Tracker");
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    setBaseUrl(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const [allStudents, allGrades, allGroups, settings, teacherRes] = await Promise.all([
          StudentsService.getStudentsByTeacherId(session.user.id),
          GradesService.getGradesByTeacherId(session.user.id),
          GroupsService.getGroupsByTeacherId(session.user.id),
          SystemSettingsService.getSettings(),
          supabase.from("teachers").select("name").eq("id", session.user.id).single()
        ]);

        let fallbackName = "Student Tracker";
        if (teacherRes.data && teacherRes.data.name) {
          fallbackName = teacherRes.data.name;
        }

        if (settings) {
          setSiteLogo(settings.site_logo || "");
          // @ts-ignore
          setSiteName(settings.sidebar_name || settings.site_name || fallbackName);
        } else {
          setSiteName(fallbackName);
        }

        const gradesMap = allGrades.reduce((acc, g) => ({ ...acc, [g.id]: g.name }), {});
        const groupsMap = allGroups.reduce((acc, g) => ({ ...acc, [g.id]: g.name }), {});
        setGrades(gradesMap);
        setGroups(groupsMap);
        setAllGradesList(allGrades);
        setAllGroupsList(allGroups);
        setStudents(allStudents);
      } catch (error) {
        console.error("Error loading data for print:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [gradeId, groupId]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.code && s.code.includes(searchQuery));
    const matchesGrade = filterGradeId === "all" || s.grade_id === filterGradeId;
    const matchesGroup = filterGroupId === "all" ? true : filterGroupId === "none" ? !s.group_id : s.group_id === filterGroupId;
    return matchesSearch && matchesGrade && matchesGroup;
  });

  const filteredGroupsList = filterGradeId === "all" ? allGroupsList : allGroupsList.filter(g => g.grade_id === filterGradeId);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));
  const toggleSelectAll = () =>
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filteredStudents.map(s => s.id)));

  const printSelected = () => {
    const ids = selectedIds;
    // hide non-selected cards via CSS class before printing
    document.querySelectorAll<HTMLElement>(".id-card").forEach(el => {
      el.classList.toggle("pqr-hide-print", !ids.has(el.dataset.id || ""));
    });
    window.print();
    document.querySelectorAll<HTMLElement>(".id-card").forEach(el => el.classList.remove("pqr-hide-print"));
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Students QR Data");

      worksheet.columns = [
        { header: "م", key: "index", width: 6 },
        { header: "اسم الطالب", key: "name", width: 25 },
        { header: "الصف", key: "grade", width: 15 },
        { header: "المجموعة", key: "group", width: 15 },
        { header: "هاتف ولي الأمر", key: "parent_phone", width: 18 },
        { header: "كود الطالب", key: "code", width: 15 },
        { header: "QR Code", key: "qr", width: 15 } 
      ];

      for (let i = 0; i < filteredStudents.length; i++) {
        const s = filteredStudents[i];
        // Use s.code if available, otherwise just use a fallback like short ID
        const studentCode = s.code || s.id.split('-')[0];
        
        const row = worksheet.addRow({
          index: i + 1,
          name: s.name,
          grade: s.grade_id ? (grades[s.grade_id] || "غير محدد") : "غير محدد",
          group: s.group_id ? (groups[s.group_id] || "غير محدد") : "بدون مجموعة",
          parent_phone: s.parent_phone || "-",
          code: studentCode
        });
        
        // Increase row height to fit the QR code image
        row.height = 75;
        
        // Center the text vertically and horizontally
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        
        // Generate QR Code base64
        const qrValue = baseUrl ? `${baseUrl}/report/${s.id}` : s.id;
        const qrDataUrl = await QRCode.toDataURL(qrValue, { margin: 1, width: 100 });
        
        // Add image to workbook
        const imageId = workbook.addImage({
          base64: qrDataUrl,
          extension: 'png',
        });
        
        // Embed image in the "QR Code" column (column index 6, row index i+1)
        // ExcelJS uses 0-based indexing for positioning: col 6 is the 7th column (QR Code)
        worksheet.addImage(imageId, {
          tl: { col: 6, row: i + 1 },
          ext: { width: 100, height: 100 },
          editAs: 'oneCell'
        });
      }

      // Make headers bold and centered
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      headerRow.height = 25;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), "students_qr_data.xlsx");
    } catch (err) {
      console.error("Failed to export Excel", err);
      alert("حدث خطأ أثناء تصدير ملف الإكسل");
    }
  };

  if (loading) {
    return <Spinner fullScreen />;
  }

  return (
    <div className="print-container">
      {/* Non-printable header */}
      <div className="no-print pqr-header">
        <div className="pqr-header-top">
          <div>
            <h1 className="pqr-title">طباعة بطاقات QR</h1>
            <p className="pqr-subtitle">{filteredStudents.length} طالب جاهز للطباعة</p>
          </div>
          <div className="pqr-actions">
            <Button variant="secondary" onClick={() => router.back()} leftIcon={<ArrowRight size={18} />}>رجوع</Button>
            <Button variant="secondary" onClick={exportToExcel} leftIcon={<Download size={18} />} className="pqr-btn-excel">تصدير إكسل</Button>
            {selectedIds.size > 0 && (
              <Button variant="secondary" onClick={printSelected} leftIcon={<Printer size={18} />} className="pqr-btn-selected">
                طباعة المحددين ({selectedIds.size})
              </Button>
            )}
            <Button variant="primary" onClick={() => window.print()} leftIcon={<Printer size={18} />}>طباعة الكل</Button>
          </div>
        </div>

        <div className="pqr-filters">
          <button className="pqr-select-all-btn" onClick={toggleSelectAll}>
            {allFilteredSelected
              ? <><CheckSquare size={16} /> إلغاء تحديد الكل</>
              : <><Square size={16} /> تحديد الكل</>}
          </button>
          <div className="pqr-search-wrapper">
            <span className="pqr-search-icon">🔍</span>
            <input
              type="text"
              placeholder="بحث باسم الطالب أو الكود..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pqr-search-input"
            />
          </div>
          <select value={filterGradeId} onChange={e => { setFilterGradeId(e.target.value); setFilterGroupId("all"); }} className="pqr-select">
            <option value="all">📚 كل الصفوف</option>
            {allGradesList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={filterGroupId} onChange={e => setFilterGroupId(e.target.value)} className="pqr-select">
            <option value="all">👥 كل المجموعات</option>
            <option value="none">بدون مجموعة</option>
            {filteredGroupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="no-print" style={{ textAlign: "center", padding: "3rem", background: "var(--panel-bg)", borderRadius: "10px" }}>
          <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>لا يوجد طلاب مطابقين للفلتر المختار لطباعتهم.</p>
        </div>
      ) : (
        <div className="print-grid">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              data-id={student.id}
              className={`id-card pqr-card ${selectedIds.has(student.id) ? "pqr-card-selected" : ""}`}
              onClick={() => toggleSelect(student.id)}
            >
              <div className="pqr-card-check no-print">
                {selectedIds.has(student.id) ? <CheckSquare size={18} className="pqr-check-icon active" /> : <Square size={18} className="pqr-check-icon" />}
              </div>
              <div className="id-card-header">
                {siteLogo ? (
                  <img src={siteLogo} alt="Logo" className="id-card-logo" />
                ) : (
                  <div className="id-card-site-name">{siteName}</div>
                )}
              </div>
              
              <h3 className="student-name">{student.name}</h3>
              <div className="id-card-body">
                <div className="qr-wrapper">
                  <QRCodeSVG 
                    value={baseUrl ? `${baseUrl}/report/${student.id}` : student.id} 
                    size={100}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="student-info-wrapper">
                  
                  <div className="student-details">
                  <div className="detail-row">
                    <span className="detail-label">السنة:</span>
                    <span className="detail-value">{student.grade_id ? grades[student.grade_id] : "-"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">المجموعة:</span>
                    <span className="detail-value">{student.group_id ? groups[student.group_id] : "-"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">الكود:</span>
                    <span className="detail-value code-value monospace">{student.code || student.id.split('-')[0]}</span>
                  </div>
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PrintQRPage() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <PrintQRContent />
    </Suspense>
  );
}
