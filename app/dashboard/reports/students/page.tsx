"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { RiSettings3Line } from "react-icons/ri";

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
      selectedMonthIndex, selectedYear
    );

  return (
    <div className="sr-page">
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
