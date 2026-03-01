"use client";

import { Zap, Loader2 } from "lucide-react";
import { Tables } from "@/types/database";

type ChargingSession = Tables<"charging_sessions">;

interface ChargingHistoryProps {
  sessions: ChargingSession[];
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
  if (!endStr) return "充電中";
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function ChargingHistory({
  sessions,
  isLoading,
}: ChargingHistoryProps) {
  return (
    <div className="rounded-3xl bg-[var(--ev-surface)] overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[var(--ev-accent)]" />
          <span className="text-xs text-[var(--ev-text-muted)]">充電履歴</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-4 h-4 text-[var(--ev-text-muted)] animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="px-6 pb-8 text-center">
          <Zap className="w-8 h-8 text-[var(--ev-surface-3)] mx-auto mb-3" />
          <p className="text-sm text-[var(--ev-text-muted)]">履歴なし</p>
        </div>
      ) : (
        <div className="px-3 pb-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="px-3 py-3 rounded-2xl hover:bg-[var(--ev-surface-2)] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[var(--ev-text-muted)]">
                  {formatDate(session.started_at)}
                </span>
                <span className="text-[11px] text-[var(--ev-text-muted)]">
                  {formatDuration(session.started_at, session.ended_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                    {session.energy_added_kwh != null
                      ? `${session.energy_added_kwh.toFixed(1)}`
                      : "—"}
                  </span>
                  <span className="text-[11px] text-[var(--ev-text-muted)]">kWh</span>
                </div>
                <div className="text-xs text-[var(--ev-text-muted)] tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                  {session.start_battery_level ?? "?"}% → {session.end_battery_level ?? "?"}%
                </div>
                <div className="text-xs text-[var(--ev-text-muted)]">
                  {session.cost_estimate_jpy != null
                    ? `¥${session.cost_estimate_jpy.toLocaleString()}`
                    : ""}
                </div>
              </div>
              {session.location_name && (
                <div className="mt-1.5 text-[11px] text-[var(--ev-text-muted)]">
                  {session.location_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
