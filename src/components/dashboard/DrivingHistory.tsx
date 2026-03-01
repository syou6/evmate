"use client";

import { Navigation, Loader2 } from "lucide-react";
import { Tables } from "@/types/database";

type DrivingTrip = Tables<"driving_trips">;

interface DrivingHistoryProps {
  trips: DrivingTrip[];
  isLoading: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startStr: string, endStr: string | null): string {
  if (!endStr) return "走行中";
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function DrivingHistory({
  trips,
  isLoading,
}: DrivingHistoryProps) {
  return (
    <div className="rounded-3xl bg-[var(--ev-surface)] overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-[var(--ev-accent)]" />
          <span className="text-xs text-[var(--ev-text-muted)]">走行履歴</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-4 h-4 text-[var(--ev-text-muted)] animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="px-6 pb-8 text-center">
          <Navigation className="w-8 h-8 text-[var(--ev-surface-3)] mx-auto mb-3" />
          <p className="text-sm text-[var(--ev-text-muted)]">履歴なし</p>
        </div>
      ) : (
        <div className="px-3 pb-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="px-3 py-3 rounded-2xl hover:bg-[var(--ev-surface-2)] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[var(--ev-text-muted)]">
                  {formatDate(trip.started_at)}
                </span>
                <span className="text-[11px] text-[var(--ev-text-muted)]">
                  {formatDuration(trip.started_at, trip.ended_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                    {trip.distance_km != null ? trip.distance_km.toFixed(1) : "—"}
                  </span>
                  <span className="text-[11px] text-[var(--ev-text-muted)]">km</span>
                </div>
                <div className="text-xs text-[var(--ev-text-muted)] tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                  {trip.start_battery_level ?? "?"}% → {trip.end_battery_level ?? "?"}%
                </div>
                <div className="text-xs text-[var(--ev-text-muted)]">
                  {trip.efficiency_wh_per_km != null
                    ? `${Math.round(trip.efficiency_wh_per_km)} Wh/km`
                    : ""}
                </div>
              </div>
              {trip.avg_speed_kmh != null && (
                <div className="mt-1.5 text-[11px] text-[var(--ev-text-muted)]">
                  平均 {Math.round(trip.avg_speed_kmh)} km/h
                  {trip.energy_used_kwh != null && (
                    <span className="ml-3">{trip.energy_used_kwh.toFixed(1)} kWh</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
