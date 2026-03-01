"use client";

import { useState, useEffect, useCallback } from "react";
import { Tables } from "@/types/database";

type DrivingTrip = Tables<"driving_trips">;

export function useDrivingTrips(vehicleId: string | null) {
  const [trips, setTrips] = useState<DrivingTrip[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!vehicleId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ vehicle_id: vehicleId, limit: "10" });
      const res = await fetch(`/api/tesla/driving-trips?${params}`);

      if (!res.ok) return;

      const body = (await res.json()) as { trips: DrivingTrip[] };
      setTrips(body.trips);
    } catch {
      // Non-critical: history is supplementary
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { trips, isLoading, refresh: fetch_ };
}
