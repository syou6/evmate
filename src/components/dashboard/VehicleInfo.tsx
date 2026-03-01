"use client";

import { Lock, Unlock, Eye, EyeOff, Thermometer, Gauge } from "lucide-react";

interface VehicleInfoProps {
  name: string;
  odometer: number;
  isLocked: boolean;
  sentryMode: boolean;
  insideTemp: number;
  outsideTemp: number;
  softwareVersion: string;
}

export default function VehicleInfo({
  name,
  odometer,
  isLocked,
  sentryMode,
  insideTemp,
  outsideTemp,
  softwareVersion,
}: VehicleInfoProps) {
  const statusItems = [
    {
      icon: isLocked ? Lock : Unlock,
      label: "ロック",
      value: isLocked ? "施錠" : "解錠",
      color: isLocked ? "var(--ev-charge)" : "var(--ev-warning)",
    },
    {
      icon: sentryMode ? Eye : EyeOff,
      label: "セントリー",
      value: sentryMode ? "ON" : "OFF",
      color: sentryMode ? "var(--ev-charge)" : "var(--ev-text-muted)",
    },
    {
      icon: Thermometer,
      label: "車内 / 外気",
      value: `${insideTemp}° / ${outsideTemp}°`,
      color: "var(--ev-blue)",
    },
    {
      icon: Gauge,
      label: "走行距離",
      value: `${odometer.toLocaleString()} km`,
      color: "var(--ev-text-secondary)",
    },
  ];

  return (
    <div className="h-full rounded-3xl bg-[var(--ev-surface)] p-8 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs text-[var(--ev-text-muted)] mb-2">Vehicle</div>
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {name}
        </h2>
        <div className="text-xs text-[var(--ev-text-muted)] mt-1">
          v{softwareVersion}
        </div>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {statusItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-[var(--ev-surface-2)] p-4 flex flex-col justify-center"
          >
            <item.icon className="w-4 h-4 mb-3" style={{ color: item.color }} />
            <div className="text-[11px] text-[var(--ev-text-muted)] mb-1">{item.label}</div>
            <div
              className="text-sm font-medium"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
