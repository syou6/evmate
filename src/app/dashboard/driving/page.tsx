"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Calendar,
  Route,
  Zap,
  Trophy,
  ChevronRight,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useTeslaData } from "@/hooks/useTeslaData";
import { useDrivingTrips } from "@/hooks/useDrivingTrips";
import { Tables } from "@/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Japanese electricity cost per kWh (¥). Standard residential rate. */
const JPY_PER_KWH = 27;

/** Days of the week labels */
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DrivingTrip = Tables<"driving_trips">;

interface DayEfficiency {
  label: string;
  whPerKm: number | null;
  tripCount: number;
}

// ---------------------------------------------------------------------------
// Derived data helpers
// ---------------------------------------------------------------------------

function totalDistanceKm(trips: DrivingTrip[]): number {
  return trips.reduce((sum, t) => sum + (t.distance_km ?? 0), 0);
}

function weightedAvgEfficiency(trips: DrivingTrip[]): number | null {
  const valid = trips.filter(
    (t) => t.efficiency_wh_per_km != null && t.distance_km != null && t.distance_km > 0
  );
  if (valid.length === 0) return null;
  const totalDistance = valid.reduce((s, t) => s + (t.distance_km ?? 0), 0);
  const totalEnergy = valid.reduce(
    (s, t) => s + (t.efficiency_wh_per_km ?? 0) * (t.distance_km ?? 0),
    0
  );
  return totalDistance > 0 ? Math.round(totalEnergy / totalDistance) : null;
}

function estimatedCostJpy(trips: DrivingTrip[]): number {
  const totalKwh = trips.reduce((s, t) => s + (t.energy_used_kwh ?? 0), 0);
  return Math.round(totalKwh * JPY_PER_KWH);
}

/** Group trips by day-of-week for the bar chart */
function groupByDayOfWeek(trips: DrivingTrip[]): DayEfficiency[] {
  // Day index: 0=Mon, 6=Sun (JS: 0=Sun, so we offset)
  const buckets: { totalWh: number; totalKm: number; count: number }[] = Array.from(
    { length: 7 },
    () => ({ totalWh: 0, totalKm: 0, count: 0 })
  );

  trips.forEach((trip) => {
    if (!trip.started_at || !trip.distance_km || !trip.efficiency_wh_per_km) return;
    const d = new Date(trip.started_at);
    const jsDay = d.getDay(); // 0=Sun..6=Sat
    const idx = jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0..Sun=6
    buckets[idx].totalWh += trip.efficiency_wh_per_km * trip.distance_km;
    buckets[idx].totalKm += trip.distance_km;
    buckets[idx].count += 1;
  });

  return buckets.map((b, i) => ({
    label: DAY_LABELS[i],
    whPerKm: b.totalKm > 0 ? Math.round(b.totalWh / b.totalKm) : null,
    tripCount: b.count,
  }));
}

/** Top 5 most efficient trips (sorted by wh/km ascending = more efficient) */
function topEfficientTrips(trips: DrivingTrip[]): DrivingTrip[] {
  return [...trips]
    .filter((t) => t.efficiency_wh_per_km != null && t.distance_km != null)
    .sort((a, b) => (a.efficiency_wh_per_km ?? 999) - (b.efficiency_wh_per_km ?? 999))
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

function currentMonthLabel(): string {
  return new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
}

// ---------------------------------------------------------------------------
// Efficiency badge color
// ---------------------------------------------------------------------------

function efficiencyBadge(whPerKm: number) {
  let bg: string;
  let color: string;
  let border: string;

  if (whPerKm <= 140) {
    bg = "rgba(34, 197, 94, 0.1)";
    color = "#22c55e";
    border = "rgba(34, 197, 94, 0.2)";
  } else if (whPerKm <= 165) {
    bg = "rgba(245, 158, 11, 0.1)";
    color = "#f59e0b";
    border = "rgba(245, 158, 11, 0.2)";
  } else {
    bg = "rgba(239, 68, 68, 0.1)";
    color = "#ef4444";
    border = "rgba(239, 68, 68, 0.2)";
  }

  return (
    <span
      className="px-2 py-1 rounded-full font-medium text-xs border"
      style={{ background: bg, color, borderColor: border }}
    >
      {whPerKm} Wh/km
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  value: React.ReactNode;
  trend: React.ReactNode;
  watermarkIcon: React.ReactNode;
}

function SummaryCard({
  icon,
  label,
  value,
  trend,
  watermarkIcon,
}: SummaryCardProps) {
  return (
    <div
      className="rounded-xl p-6 border flex flex-col gap-4 relative overflow-hidden group"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border-d)",
      }}
    >
      {/* Watermark icon */}
      <div
        className="absolute right-0 top-0 p-4 opacity-[0.07] group-hover:opacity-[0.14] transition-opacity pointer-events-none"
        style={{ color: "var(--color-primary)" }}
      >
        {watermarkIcon}
      </div>

      <div className="flex items-center gap-2">
        <div
          className="p-2 rounded-lg"
          style={{
            background: "rgba(19, 164, 236, 0.1)",
            color: "var(--color-primary)",
          }}
        >
          {icon}
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--color-txt-mut)" }}>
          {label}
        </p>
      </div>

      <div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="flex items-center gap-1 mt-1 text-sm font-medium">
          {trend}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly bar chart
// ---------------------------------------------------------------------------

interface WeeklyChartProps {
  data: DayEfficiency[];
}

function WeeklyChart({ data }: WeeklyChartProps) {
  const values = data.map((d) => d.whPerKm ?? 0);
  const maxVal = Math.max(...values, 1);
  // Use the fleet benchmark as threshold for red/blue bars: >160 = high
  const THRESHOLD = 160;

  return (
    <div
      className="rounded-xl border p-6 flex flex-col"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border-d)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">週間効率トレンド</h3>
          <p className="text-sm" style={{ color: "var(--color-txt-mut)" }}>
            曜日別平均消費量（Wh/km）
          </p>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end justify-between gap-2 sm:gap-4 min-h-[240px] px-2 pb-6 relative">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full border-t"
              style={{ borderColor: "rgba(35, 60, 72, 0.5)" }}
            />
          ))}
        </div>

        {data.map((day) => {
          const heightPct =
            day.whPerKm != null && maxVal > 0
              ? Math.max(4, (day.whPerKm / maxVal) * 100)
              : 0;
          const isHigh = (day.whPerKm ?? 0) > THRESHOLD;
          const hasData = day.whPerKm != null && day.tripCount > 0;

          const barColor = !hasData
            ? "rgba(35, 60, 72, 0.4)"
            : isHigh
            ? "rgba(239, 68, 68, 0.7)"
            : "rgba(19, 164, 236, 0.6)";

          const barHoverColor = !hasData
            ? "rgba(35, 60, 72, 0.4)"
            : isHigh
            ? "#ef4444"
            : "#13a4ec";

          return (
            <div
              key={day.label}
              className="flex flex-col items-center gap-2 flex-1 group/bar"
            >
              <div
                className="w-full rounded-t-sm relative flex items-end overflow-visible"
                style={{
                  height: "200px",
                  background: "rgba(35, 60, 72, 0.3)",
                }}
              >
                <div
                  className="w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height: hasData ? `${heightPct}%` : "0%",
                    background: barColor,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      barHoverColor;
                    const tooltip = (e.currentTarget as HTMLDivElement)
                      .nextElementSibling as HTMLElement;
                    if (tooltip) tooltip.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      barColor;
                    const tooltip = (e.currentTarget as HTMLDivElement)
                      .nextElementSibling as HTMLElement;
                    if (tooltip) tooltip.style.opacity = "0";
                  }}
                />
                {/* Tooltip */}
                {hasData && (
                  <div
                    className="absolute -top-9 left-1/2 -translate-x-1/2 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity"
                    style={{
                      background: "var(--color-border-d)",
                      opacity: 0,
                    }}
                  >
                    {day.whPerKm} Wh/km
                  </div>
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-txt-mut)" }}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top 5 efficient trips leaderboard
// ---------------------------------------------------------------------------

interface TopTripsProps {
  trips: DrivingTrip[];
}

function TopTripsLeaderboard({ trips }: TopTripsProps) {
  const rankColors = ["#f59e0b", "#94a3b8", "#92400e", "#64748b", "#64748b"];

  return (
    <div
      className="rounded-xl border p-6 flex flex-col"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border-d)",
      }}
    >
      <div className="flex items-center gap-2 mb-6">
        <div
          className="p-2 rounded-full"
          style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}
        >
          <Trophy className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold">効率トップ5トリップ</h3>
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--color-txt-mut)" }}>
          トリップデータがまだありません。
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {trips.map((trip, idx) => {
            const isMedal = idx < 3;
            const distStr = trip.distance_km != null
              ? `${Math.round(trip.distance_km)} km`
              : "—";
            const dateStr = formatDate(trip.started_at);

            return (
              <div
                key={trip.id}
                className="flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer border border-transparent"
                style={{
                  background:
                    isMedal ? "rgba(26, 44, 53, 0.6)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "var(--color-surface-hi)";
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(19, 164, 236, 0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    isMedal ? "rgba(26, 44, 53, 0.6)" : "transparent";
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "transparent";
                }}
              >
                <div
                  className="flex-none font-bold text-lg w-6 text-center"
                  style={{ color: rankColors[idx] ?? "var(--color-txt-mut)" }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    Trip #{trip.id.slice(-6)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-txt-mut)" }}
                  >
                    {dateStr} · {distStr}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="font-bold text-sm"
                    style={{
                      color:
                        idx < 3 ? "var(--color-primary)" : "var(--color-txt-sec)",
                    }}
                  >
                    {trip.efficiency_wh_per_km ?? "—"}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--color-txt-mut)" }}
                  >
                    Wh/km
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent trips table
// ---------------------------------------------------------------------------

interface TripTableProps {
  trips: DrivingTrip[];
}

function TripTable({ trips }: TripTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      trips.filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          t.started_at.toLowerCase().includes(q) ||
          String(t.distance_km ?? "").includes(q)
        );
      }),
    [trips, search]
  );

  return (
    <div
      className="rounded-xl border flex flex-col overflow-hidden"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border-d)",
      }}
    >
      {/* Table header */}
      <div
        className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ borderColor: "var(--color-border-d)" }}
      >
        <h2 className="text-xl font-bold">最近のトリップログ</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="トリップを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-4 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 w-full sm:w-64 placeholder-slate-500"
            style={{
              background: "rgba(35, 60, 72, 0.4)",
              color: "var(--color-txt)",
              border: "none",
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="text-xs uppercase tracking-wider font-semibold border-b"
              style={{
                background: "rgba(26, 44, 53, 0.5)",
                color: "var(--color-txt-mut)",
                borderColor: "var(--color-border-d)",
              }}
            >
              <th className="p-4 pl-6">日時</th>
              <th className="p-4">ルート/目的地</th>
              <th className="p-4 text-right">距離</th>
              <th className="p-4 text-right">効率</th>
              <th className="p-4 text-right">バッテリー消費</th>
              <th className="p-4 text-right">推定コスト</th>
              <th className="p-4 pr-6" />
            </tr>
          </thead>
          <tbody className="text-sm divide-y" style={{ borderColor: "var(--color-border-d)" }}>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-sm"
                  style={{ color: "var(--color-txt-mut)" }}
                >
                  {trips.length === 0
                    ? "トリップの記録がありません。"
                    : "一致するトリップがありません。"}
                </td>
              </tr>
            ) : (
              filtered.map((trip) => {
                const battUsed =
                  trip.start_battery_level != null &&
                  trip.end_battery_level != null
                    ? trip.start_battery_level - trip.end_battery_level
                    : null;
                const costJpy = trip.energy_used_kwh != null
                  ? Math.round(trip.energy_used_kwh * JPY_PER_KWH)
                  : null;

                return (
                  <tr
                    key={trip.id}
                    className="group transition-colors"
                    style={{ borderColor: "var(--color-border-d)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        "rgba(26, 44, 53, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        "transparent";
                    }}
                  >
                    <td className="p-4 pl-6 font-medium">
                      {formatDateTime(trip.started_at)}
                    </td>
                    <td
                      className="p-4"
                      style={{ color: "var(--color-txt-sec)" }}
                    >
                      {/* TODO: Add reverse-geocoded start/end location from lat/lng */}
                      Trip #{trip.id.slice(-8)}
                    </td>
                    <td
                      className="p-4 text-right"
                      style={{ color: "var(--color-txt-sec)" }}
                    >
                      {trip.distance_km != null
                        ? `${Math.round(trip.distance_km * 10) / 10} km`
                        : "—"}
                    </td>
                    <td className="p-4 text-right">
                      {trip.efficiency_wh_per_km != null
                        ? efficiencyBadge(Math.round(trip.efficiency_wh_per_km))
                        : <span style={{ color: "var(--color-txt-mut)" }}>—</span>}
                    </td>
                    <td
                      className="p-4 text-right"
                      style={{ color: "var(--color-txt-sec)" }}
                    >
                      {battUsed != null ? `${battUsed}%` : "—"}
                    </td>
                    <td
                      className="p-4 text-right"
                      style={{ color: "var(--color-txt-sec)" }}
                    >
                      {costJpy != null ? `¥${costJpy}` : "—"}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--color-txt-mut)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--color-primary)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--color-txt-mut)";
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {trips.length > 0 && (
        <div
          className="p-4 border-t flex justify-center"
          style={{
            borderColor: "var(--color-border-d)",
            background: "rgba(26, 44, 53, 0.2)",
          }}
        >
          <button
            className="font-medium text-sm flex items-center gap-2 transition-opacity hover:opacity-70"
            style={{ color: "var(--color-primary)" }}
          >
            すべてのトリップを見る
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading / Error states
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "var(--color-primary)" }}
        />
        <p style={{ color: "var(--color-txt-mut)" }}>トリップデータを読み込み中...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <AlertTriangle
          className="w-8 h-8"
          style={{ color: "var(--color-danger)" }}
        />
        <p className="font-semibold">走行データの読み込みに失敗</p>
        <p className="text-sm" style={{ color: "var(--color-txt-mut)" }}>
          {message}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DrivingPage() {
  const { state } = useTeslaData();

  const vehicleDbId =
    state.status === "success" ? String(state.data.vehicle.id) : null;

  const { trips, isLoading: tripsLoading } = useDrivingTrips(vehicleDbId);

  if (state.status === "loading" || tripsLoading) return <LoadingState />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  // Derived statistics from real trip data
  const totalDist = totalDistanceKm(trips);
  const avgEff = weightedAvgEfficiency(trips);
  const totalCostJpy = estimatedCostJpy(trips);

  const weeklyData = groupByDayOfWeek(trips);
  const top5Trips = topEfficientTrips(trips);

  // Month label for subtitle
  const monthLabel = currentMonthLabel();

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ letterSpacing: "-0.015em" }}
          >
            走行効率
          </h1>
          <p className="text-base" style={{ color: "var(--color-txt-mut)" }}>
            {monthLabel}の概要
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date picker (decorative — full calendar picker out of scope) */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border-d)",
              color: "var(--color-txt-sec)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--color-surface-hi)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--color-surface)";
            }}
          >
            <Calendar className="w-4 h-4" />
            <span>{monthLabel}</span>
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{
              background: "var(--color-primary)",
              boxShadow: "0 4px 14px rgba(19, 164, 236, 0.25)",
            }}
          >
            <Download className="w-4 h-4" />
            <span>レポート出力</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Distance */}
        <SummaryCard
          icon={<Route className="w-5 h-5" />}
          label="総走行距離"
          value={
            <span>
              {totalDist >= 1000
                ? `${(totalDist / 1000).toFixed(1)}k`
                : Math.round(totalDist)}{" "}
              km
            </span>
          }
          trend={
            trips.length > 0 ? (
              <>
                <TrendingUp className="w-4 h-4" style={{ color: "var(--color-ok)" }} />
                <span style={{ color: "var(--color-ok)" }}>
                  {trips.length}件のトリップ記録
                </span>
              </>
            ) : (
              <span style={{ color: "var(--color-txt-mut)" }}>トリップなし</span>
            )
          }
          watermarkIcon={<Route className="w-16 h-16" />}
        />

        {/* Avg Efficiency */}
        <SummaryCard
          icon={<Zap className="w-5 h-5" />}
          label="平均効率"
          value={
            <span>
              {avgEff != null ? `${avgEff} Wh/km` : "—"}
            </span>
          }
          trend={
            avgEff != null ? (
              avgEff <= 150 ? (
                <>
                  <TrendingDown
                    className="w-4 h-4"
                    style={{ color: "var(--color-ok)" }}
                  />
                  <span style={{ color: "var(--color-ok)" }}>
                    効率的な走行
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: "var(--color-warn)" }}
                  />
                  <span style={{ color: "var(--color-warn)" }}>
                    平均以上の消費
                  </span>
                </>
              )
            ) : (
              <span style={{ color: "var(--color-txt-mut)" }}>データなし</span>
            )
          }
          watermarkIcon={<Zap className="w-16 h-16" />}
        />

        {/* Est. Charging Cost */}
        <SummaryCard
          icon={
            <span className="text-base font-bold" style={{ color: "var(--color-primary)" }}>
              ¥
            </span>
          }
          label="推定充電コスト"
          value={<span>¥{totalCostJpy.toLocaleString()}</span>}
          trend={
            <span style={{ color: "var(--color-txt-mut)" }}>
              @¥{JPY_PER_KWH}/kWh est.
            </span>
          }
          watermarkIcon={
            <span className="text-6xl font-bold" style={{ color: "inherit" }}>
              ¥
            </span>
          }
        />
      </div>

      {/* Chart + Top 5 Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyChart data={weeklyData} />
        </div>
        <div className="lg:col-span-1">
          <TopTripsLeaderboard trips={top5Trips} />
        </div>
      </div>

      {/* Recent Trip Log table */}
      <TripTable trips={trips} />
    </div>
  );
}
