"use client";

import { AlertCircle, Check } from "lucide-react";
import { useBills } from "./_hooks/useBills";
import BillsHeader from "./_components/BillsHeader";
import BillsSummaryCards from "./_components/BillsSummaryCards";
import MonthlyOverview from "./_components/MonthlyOverview";
import BillsTable from "./_components/BillsTable";
import AddBillDrawer from "./_components/AddBillDrawer";
import EditBillModal from "./_components/EditBillModal";
import BulkActionBar from "./_components/BulkActionBar";
import GenerateBanner from "./_components/GenerateBanner";

export default function BillsManagement() {
  const {
    loading, actionLoading, userId,
    bills, filteredBills, totalFiltered, totalYear, categoryTotals,
    templates, activeTemplatesCount,
    selectedBillIds, allFilteredSelected, someFilteredSelected,
    activeMonth, setActiveMonth,
    activeYear, setActiveYear, availableYears,
    editingBill, setEditingBill,
    showAddForm, setShowAddForm,
    activeTab, setActiveTab,
    showGenerateBanner, setShowGenerateBanner,
    toast,
    handleAddBill, handleUpdateBill, handleDeleteBill, handleBulkDelete,
    handleAddTemplate,
    handleGenerateForMonth,
    handleSelectAll, handleToggleRow,
  } = useBills();

  if (loading) {
    return <div className="loading-wrapper"><div className="spinner" /></div>;
  }

  const now = new Date();

  return (
    <div>
      <BillsHeader
        totalYear={totalYear}
        activeYear={activeYear}
        availableYears={availableYears}
        onYearChange={setActiveYear}
        onAddClick={() => setShowAddForm(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {showGenerateBanner && (
        <GenerateBanner
          activeTemplatesCount={activeTemplatesCount}
          actionLoading={actionLoading}
          onGenerate={() => handleGenerateForMonth(now.getMonth() + 1, now.getFullYear())}
          onDismiss={() => setShowGenerateBanner(false)}
        />
      )}

      <BillsSummaryCards
        totalYear={totalYear}
        categoryTotals={categoryTotals}
        activeYear={activeYear}
        billsCount={bills.filter(b => b.billing_year === activeYear).length}
        recurringCount={activeTemplatesCount}
      />

      {activeTab === "overview" && (
        <MonthlyOverview
          bills={bills}
          activeYear={activeYear}
          templates={templates}
          actionLoading={actionLoading}
          onMonthClick={month => { setActiveMonth(String(month)); setActiveTab("table"); }}
          onGenerate={handleGenerateForMonth}
        />
      )}

      {activeTab === "table" && (
        <BillsTable
          filteredBills={filteredBills}
          allBills={bills}
          totalFiltered={totalFiltered}
          categoryTotals={categoryTotals}
          totalYear={totalYear}
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}
          activeYear={activeYear}
          setActiveYear={setActiveYear}
          availableYears={availableYears}
          selectedBillIds={selectedBillIds}
          allFilteredSelected={allFilteredSelected}
          someFilteredSelected={someFilteredSelected}
          onSelectAll={handleSelectAll}
          onToggleRow={handleToggleRow}
          onDelete={handleDeleteBill}
          onEdit={setEditingBill}
        />
      )}

      <AddBillDrawer
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        actionLoading={actionLoading}
        defaultYear={activeYear}
        onAdd={handleAddBill}
        onAddTemplate={handleAddTemplate}
        userId={userId}
      />

      {editingBill && (
        <EditBillModal
          bill={editingBill}
          actionLoading={actionLoading}
          onSave={handleUpdateBill}
          onClose={() => setEditingBill(null)}
        />
      )}

      <BulkActionBar
        count={selectedBillIds.size}
        actionLoading={actionLoading}
        onDelete={handleBulkDelete}
        onClear={() => handleSelectAll([])}
      />

      {toast && (
        <div className={`alert-toast ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
