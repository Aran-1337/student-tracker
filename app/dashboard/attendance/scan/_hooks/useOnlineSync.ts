"use client";

import { useState, useEffect, useCallback } from "react";
import { AttendanceQueue } from "@/lib/offlineQueue";
import { AttendanceRepository } from "@/lib/repositories/attendanceRepository";

export function useOnlineSync(onSynced?: (count: number) => void) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(() => {
    setPendingCount(AttendanceQueue.count());
  }, []);

  const syncQueue = useCallback(async () => {
    if (AttendanceQueue.count() === 0) return;
    setSyncing(true);
    try {
      const synced = await AttendanceRepository.syncQueue();
      setPendingCount(AttendanceQueue.count());
      if (synced > 0) onSynced?.(synced);
    } finally {
      setSyncing(false);
    }
  }, [onSynced]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPendingCount(AttendanceQueue.count());

    const handleOnline = async () => {
      setIsOnline(true);
      await syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueue]);

  return { isOnline, pendingCount, syncing, syncQueue, refreshPending };
}
