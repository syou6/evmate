"use client";

interface BatteryGaugeProps {
  level: number;
  range: number;
  isCharging: boolean;
  chargingState: string;
  chargeLimit: number;
}

export default function BatteryGauge({
  level,
  range,
  isCharging,
  chargingState,
  chargeLimit,
}: BatteryGaugeProps) {
  const getColor = (pct: number) => {
    if (pct <= 15) return "#e74c3c";
    if (pct <= 30) return "#f5a623";
    return "#3dd68c";
  };

  const color = getColor(level);
  const circumference = 2 * Math.PI * 88;
  const offset = circumference - (level / 100) * circumference;
  const limitOffset = circumference - (chargeLimit / 100) * circumference;

  return (
    <div className="h-full rounded-3xl bg-[var(--ev-surface)] p-8 flex flex-col items-center justify-center">
      {/* Charging indicator */}
      {isCharging && (
        <div className="flex items-center gap-2 mb-4 animate-charge">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-xs text-[var(--ev-text-secondary)]">
            {chargingState === "Charging" ? "充電中" : chargingState}
          </span>
        </div>
      )}

      {/* Circular gauge */}
      <div className="relative w-52 h-52 mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            stroke="var(--ev-surface-2)"
            strokeWidth="6"
          />
          {/* Charge limit marker */}
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            stroke="var(--ev-surface-3)"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={limitOffset}
            strokeLinecap="round"
          />
          {/* Battery level */}
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold tabular-nums"
            style={{ fontFamily: "var(--font-display)", color }}
          >
            {level}
          </span>
          <span className="text-sm text-[var(--ev-text-muted)]">%</span>
        </div>
      </div>

      {/* Range */}
      <div className="text-center">
        <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
          {range} <span className="text-sm font-normal text-[var(--ev-text-muted)]">km</span>
        </div>
        <div className="text-xs text-[var(--ev-text-muted)] mt-1">航続距離</div>
      </div>

      {/* Charge limit label */}
      <div className="mt-4 text-xs text-[var(--ev-text-muted)]">
        充電上限 {chargeLimit}%
      </div>
    </div>
  );
}
