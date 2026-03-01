"use client";

import { useState, useEffect, useCallback } from "react";
import { Tables } from "@/types/database";

type ChargingSession = Tables<"charging_sessions">;

export function useChargingHistory(vehicleId: string | null) {
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!vehicleId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ vehicle_id: vehicleId, limit: "10" });
      const res = await fetch(`/api/tesla/charging-history?${params}`);

      if (!res.ok) return;

      const body = (await res.json()) as { sessions: ChargingSession[] };
      setSessions(body.sessions);
    } catch {
      // Non-critical: history is supplementary
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { sessions, isLoading, refresh: fetch_ };
}
