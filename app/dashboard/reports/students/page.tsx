"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { RiSettings3Line } from "react-icons/ri";

import Link from "next/link";
import { CalendarCheck, TrendingUp, Users } from "lucide-react";
import { useStudentReports } from "./_hooks/useStudentReports";
import { exportStudentsReportPDF } from "./_utils/exportPDF";
import ReportsHeader from "./_components/ReportsHeader";
import ReportsFilters from "./_components/ReportsFilters";
import ReportsStatsCards from "./_components/ReportsStatsCards";
import StudentsReportTable from "./_components/StudentsReportTable";
import WhatsAppTemplateModal from "./_components/WhatsAppTemplateModal";

import "@/app/styles/studentReports.css";

export default function StudentReportsPage() {
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const {
    loading,
    grades, groups,
    filteredStudents, pagedStudents, filteredGroups,
    stats,
    getStudentAttendance,
    getStudentExamsText,
    whatsappTemplate, setWhatsappTemplate,
    toast, setToast,
    searchQuery, setSearchQuery,
    filterGradeId, setFilterGradeId,
    filterGroupId, setFilterGroupId,
    filterPayment, setFilterPayment,
    selectedMonthIndex, setSelectedMonthIndex,
    selectedYear, setSelectedYear,
    page, setPage, totalPages,
    sendWhatsApp, sendAllWhatsApp,
  } = useStudentReports();

  if (loading) return <Spinner fullScreen />;

  const handleExportPDF = () =>
    exportStudentsReportPDF(
      filteredStudents, grades, groups,
      getStudentAttendance,
      getStudentExamsText,
      selectedMonthIndex, selectedYear
    );

  return (
    <div className="sr-page">
      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link
          href="/dashboard/reports/daily"
          className="btn btn-secondary"
          style={{
            padding: "0.45rem 1rem",
            borderRadius: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.88rem",
          }}
        >
          <CalendarCheck size={16} />
          <span>التقرير اليومي والمتابعة</span>
        </Link>

        <Link
          href="/dashboard/reports"
          className="btn btn-secondary"
          style={{
            padding: "0.45rem 1rem",
            borderRadius: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.88rem",
          }}
        >
          <TrendingUp size={16} />
          <span>التقارير المالية الشاملة</span>
        </Link>

        <Link
          href="/dashboard/reports/students"
          className="btn"
          style={{
            background: "rgba(59, 130, 246, 0.15)",
            color: "#3b82f6",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            fontWeight: 600,
            padding: "0.45rem 1rem",
            borderRadius: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.88rem",
          }}
        >
          <Users size={16} />
          <span>تقارير الطلاب والواتساب</span>
        </Link>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showTemplateModal && (
        <WhatsAppTemplateModal
          template={whatsappTemplate}
          onSave={setWhatsappTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      <ReportsHeader
        monthIndex={selectedMonthIndex}
        year={selectedYear}
        totalFiltered={filteredStudents.length}
        withPhone={stats.withPhone}
        onExportPDF={handleExportPDF}
        onSendAll={sendAllWhatsApp}
      />

      <ReportsFilters
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        selectedMonthIndex={selectedMonthIndex} setSelectedMonthIndex={setSelectedMonthIndex}
        selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        filterGradeId={filterGradeId} setFilterGradeId={setFilterGradeId}
        filterGroupId={filterGroupId} setFilterGroupId={setFilterGroupId}
        filterPayment={filterPayment} setFilterPayment={setFilterPayment}
        grades={grades} filteredGroups={filteredGroups}
      />

      <ReportsStatsCards {...stats} />

      {/* Template edit button */}
      <div className="sr-template-row">
        <button className="sr-btn sr-btn-ghost" onClick={() => setShowTemplateModal(true)}>
          <RiSettings3Line size={16} />
          تعديل رسالة الواتساب
        </button>
      </div>

      <StudentsReportTable
        students={pagedStudents}
        grades={grades}
        groups={groups}
        getAttendance={getStudentAttendance}
        getStudentExamsText={getStudentExamsText}
        selectedMonthIndex={selectedMonthIndex}
        onSendWhatsApp={sendWhatsApp}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        totalFiltered={filteredStudents.length}
      />
    </div>
  );
}
