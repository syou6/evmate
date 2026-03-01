"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
}: StatCardProps) {
  return (
    <div className="rounded-3xl bg-[var(--ev-surface)] p-5 flex flex-col min-h-[110px]">
      <div className="flex items-center gap-2 mb-auto">
        <Icon className="w-3.5 h-3.5 text-[var(--ev-text-muted)]" />
        <span className="text-[11px] text-[var(--ev-text-muted)]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-3">
        <span
          className="text-2xl font-bold tabular-nums truncate"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs text-[var(--ev-text-muted)] flex-shrink-0">{unit}</span>
        )}
      </div>
      {trend && (
        <div
          className={`mt-1.5 text-[11px] ${
            trend.positive ? "text-[var(--ev-charge)]" : "text-[var(--ev-danger)]"
          }`}
        >
          {trend.positive ? "↑" : "↓"} {trend.value}
        </div>
      )}
    </div>
  );
}
