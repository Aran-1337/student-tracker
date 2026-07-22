"use client";

import { Suspense } from "react";
import { ScanLine, ArrowRight, Wifi, WifiOff, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Spinner } from "@/components/ui/Spinner";
import { SessionConfig } from "./_components/SessionConfig";
import { ScannedList } from "./_components/ScannedList";
import { ScannerPanel } from "./_components/ScannerPanel";
import { useScanSession } from "./_hooks/useScanSession";
import { useOnlineSync } from "./_hooks/useOnlineSync";

function QRScanPageInner() {
  const {
    loading,
    groups, grades,
    selectedGradeId, selectedGroupId, sessionDate,
    scanning, isStarting, setIsStarting,
    scannedToday, lastScan,
    crossGroupConfirm, manualCode,
    manualPlaceholder, scannerDivId,
    groupStudentsCount,
    autoDetected,
    handleGradeChange, handleGroupChange, handleSessionDateChange,
    startScanner, stopScanner,
    handleManualSubmit, setManualCode,
    handleConfirmCrossGroup, handleCancelCrossGroup,
    handleRemoveScanned,
  } = useScanSession();

  const { isOnline, pendingCount, syncing, syncQueue } = useOnlineSync((count) => {
    // synced callback — could show a toast here if needed
    console.log(`تم رفع ${count} سجل`);
  });

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="attendance-page">
      {/* ── Header ── */}
      <div className="scan-page-header">
        <div className="scan-breadcrumb">
          <Link href="/dashboard/attendance" className="breadcrumb-link">
            <ArrowRight size={15} />
            <span>الحضور والغياب</span>
          </Link>
          <span className="breadcrumb-sep">/</span>
          <h1 className="scan-page-title">
            <ScanLine size={20} />
            وضع السكرتارية
          </h1>
        </div>

        <div className="scan-status-bar">
          <span className={`connection-badge ${isOnline ? "online" : "offline"}`}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isOnline ? "متصل" : "غير متصل"}
          </span>
          {pendingCount > 0 && (
            <button
              className="pending-sync-btn"
              onClick={syncQueue}
              disabled={!isOnline || syncing}
              title={isOnline ? "اضغط لرفع السجلات" : "في انتظار الاتصال"}
            >
              <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {pendingCount} في الانتظار
            </button>
          )}
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="scan-layout">
        <aside className="scan-sidebar">
          <SessionConfig
            grades={grades}
            groups={groups}
            selectedGradeId={selectedGradeId}
            selectedGroupId={selectedGroupId}
            sessionDate={sessionDate}
            scanning={scanning}
            isStarting={isStarting}
            manualCode={manualCode}
            manualPlaceholder={manualPlaceholder}
            autoDetected={autoDetected}
            onGradeChange={handleGradeChange}
            onGroupChange={handleGroupChange}
            onSessionDateChange={handleSessionDateChange}
            onStartScanner={async () => {
              if (isStarting) return;
              setIsStarting(true);
              await startScanner();
              setIsStarting(false);
            }}
            onStopScanner={stopScanner}
            onManualCodeChange={setManualCode}
            onManualSubmit={handleManualSubmit}
          />
          <ScannedList
            entries={scannedToday}
            totalInGroup={groupStudentsCount}
            onRemove={handleRemoveScanned}
          />
        </aside>

        <ScannerPanel
          scanning={scanning}
          selectedGroupId={selectedGroupId}
          scannerDivId={scannerDivId}
          lastScan={lastScan}
          crossGroupConfirm={crossGroupConfirm}
          onConfirmCrossGroup={handleConfirmCrossGroup}
          onCancelCrossGroup={handleCancelCrossGroup}
        />
      </div>
    </div>
  );
}

export default function QRScanPage() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <QRScanPageInner />
    </Suspense>
  );
}
