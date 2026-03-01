"use client";

import { useState } from "react";
import {
  Download,
  TrendingDown,
  TrendingUp,
  Ruler,
  BatteryCharging,
  RefreshCw,
  CheckCircle,
  Zap,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useTeslaData } from "@/hooks/useTeslaData";

const MILES_TO_KM = 1.60934;

// ---------------------------------------------------------------------------
// Derived battery calculations
// All fleet/degradation values are estimated/mock since no fleet API exists.
// TODO: Replace mock fleet data with real fleet API when available.
// ---------------------------------------------------------------------------

/** Estimated max range (km) at 100% SoC from current reading */
function estimateMaxRangeKm(batteryLevel: number, rangeKm: number): number {
  if (batteryLevel <= 0) return 0;
  return Math.round((rangeKm / batteryLevel) * 100);
}

/** Estimated degradation % vs nominal new range (Model 3 LR = 568 km) */
function estimateDegradation(maxRangeKm: number): number {
  const NOMINAL_KM = 568;
  const deg = ((NOMINAL_KM - maxRangeKm) / NOMINAL_KM) * 100;
  return Math.max(0, Math.round(deg * 10) / 10);
}

/** Estimated charge cycle count from odometer */
function estimateCycleCounts(odometerKm: number): number {
  // Rough heuristic: ~400 km average range per cycle
  return Math.round(odometerKm / 400);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  trend?: React.ReactNode;
  subtitle: string;
}

function MetricCard({ label, icon, value, trend, subtitle }: MetricCardProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-6 border"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border-d)",
      }}
    >
      <div className="flex justify-between items-start">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-txt-mut)" }}
        >
          {label}
        </p>
        {icon}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        {value}
        {trend}
      </div>
      <p className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
        {subtitle}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Line Chart (simulated, matches design)
// TODO: Replace with real time-series data from historical battery logs API.
// ---------------------------------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Generates a mock degradation curve for "Your Vehicle" starting from a
 * given current max range, going backwards 12 months with slight improvement.
 * Lower numbers = more degradation from nominal.
 */
function buildVehiclePath(currentMaxKm: number): string {
  const nominal = 568;
  const currentDegPct = Math.max(0, ((nominal - currentMaxKm) / nominal) * 100);
  // Degrade slightly more going back in time
  const points = MONTHS.map((_, i) => {
    const monthsAgo = 11 - i;
    const pastDeg = currentDegPct + monthsAgo * 0.08;
    // Map deg% to SVG Y coordinate: 0% deg = y10, 10% deg = y90
    const y = 10 + (pastDeg / 10) * 80;
    const x = (i / 11) * 100;
    return `${x},${Math.min(90, y)}`;
  });
  return `M${points.join(" L")}`;
}

// Fleet average: slightly worse degradation
const FLEET_PATH =
  "M0,20 L9,26 L18,33 L27,40 L36,47 L45,53 L55,58 L64,62 L73,66 L82,69 L91,72 L100,74";

interface RangeTrendChartProps {
  maxRangeKm: number;
}

function RangeTrendChart({ maxRangeKm }: RangeTrendChartProps) {
  const vehiclePath = buildVehiclePath(maxRangeKm);

  return (
    <div
      className="rounded-xl p-6 border relative overflow-hidden flex flex-col"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border-d)",
        height: "400px",
      }}
    >
      {/* Chart area */}
      <div className="flex-1 relative mt-2 mb-8">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full border-t"
              style={{ borderColor: "rgba(35, 60, 72, 0.6)" }}
            />
          ))}
        </div>

        {/* SVG paths */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Gradient fill under vehicle line */}
          <defs>
            <linearGradient id="vehicleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#13a4ec" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#13a4ec" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fleet average (dashed grey) */}
          <path
            d={FLEET_PATH}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            vectorEffect="non-scaling-stroke"
            opacity="0.6"
          />

          {/* Your vehicle */}
          <path
            d={vehiclePath}
            fill="none"
            stroke="#13a4ec"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* X-axis labels */}
        <div
          className="absolute bottom-0 translate-y-full left-0 right-0 flex justify-between pt-2"
          style={{ color: "var(--color-txt-mut)" }}
        >
          {MONTHS.map((m) => (
            <span key={m} className="text-[10px] font-mono">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 justify-center mt-2">
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full"
            style={{ background: "var(--color-primary)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-txt-sec)" }}
          >
            あなたの車両
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-slate-500 opacity-60" />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-txt-sec)" }}
          >
            フリート平均
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fleet comparison widget
// TODO: Replace with real fleet percentile data from fleet API.
// ---------------------------------------------------------------------------

interface FleetComparisonProps {
  degradation: number;
}

function FleetComparison({ degradation }: FleetComparisonProps) {
  // Mock percentile: lower degradation = better rank
  // Assume fleet avg ~5% deg; our vehicle at ~2-4% puts us in top 10-25%
  const percentilePos = Math.max(10, Math.min(90, 88 - degradation * 8));
  const isTopTier = percentilePos >= 80;
  const topPercent = Math.round(100 - percentilePos);

  return (
    <div
      className="rounded-xl p-6 border"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border-d)",
      }}
    >
      <h3 className="text-lg font-bold mb-2">フリート比較</h3>
      <p className="text-sm mb-6" style={{ color: "var(--color-txt-dim)" }}>
        {/* TODO: Replace with real fleet count from API */}
        日本国内の1,240台のModel 3（2021年式）オーナーと比較。
      </p>

      <div className="relative pt-6 pb-2">
        {/* Distribution bar */}
        <div
          className="h-4 w-full rounded-full overflow-hidden relative"
          style={{ background: "rgba(13, 20, 24, 0.8)" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, transparent 20%, rgba(19,164,236,0.2) 35%, rgba(19,164,236,0.45) 50%, rgba(19,164,236,0.2) 65%, transparent 80%)",
            }}
          />
          {/* User marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 z-10"
            style={{
              left: `${percentilePos}%`,
              background: "white",
              boxShadow: "0 0 8px rgba(255,255,255,0.8)",
            }}
          />
        </div>

        {/* "YOU" label above marker */}
        <div
          className="absolute -top-1 flex flex-col items-center"
          style={{ left: `${percentilePos}%`, transform: "translateX(-50%)" }}
        >
          <div
            className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded mb-1"
            style={{ background: "var(--color-primary)" }}
          >
            あなた
          </div>
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid var(--color-primary)",
            }}
          />
        </div>

        {/* Scale labels */}
        <div
          className="flex justify-between text-xs font-mono mt-2"
          style={{ color: "var(--color-txt-mut)" }}
        >
          <span>下位10%</span>
          <span>平均</span>
          <span>上位10%</span>
        </div>
      </div>

      {/* Status badge */}
      <div
        className="mt-4 p-3 rounded-lg flex gap-3 items-start border"
        style={{
          background: isTopTier
            ? "rgba(34, 197, 94, 0.08)"
            : "rgba(245, 158, 11, 0.08)",
          borderColor: isTopTier
            ? "rgba(34, 197, 94, 0.2)"
            : "rgba(245, 158, 11, 0.2)",
        }}
      >
        <CheckCircle
          className="w-4 h-4 mt-0.5 shrink-0"
          style={{
            color: isTopTier ? "var(--color-ok)" : "var(--color-warn)",
          }}
        />
        <p
          className="text-sm"
          style={{
            color: isTopTier ? "var(--color-ok)" : "var(--color-warn)",
          }}
        >
          あなたのバッテリーヘルスは同型車両の
          <strong>上位{topPercent}%</strong>です。
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Battery tips widget
// ---------------------------------------------------------------------------

const BATTERY_TIPS = [
  {
    icon: <Zap className="w-4 h-4" />,
    title: "急速充電を控える",
    desc: "頻繁なスーパーチャージャー利用はバッテリーを加熱します。日常使いはAC充電がおすすめ。",
  },
  {
    icon: <Clock className="w-4 h-4" />,
    title: "出発スケジュール設定",
    desc: "プラグイン中のプリコンディショニングで航続距離を節約し、バッテリーを保護。",
  },
];

function BatteryTips() {
  return (
    <div
      className="rounded-xl p-6 border relative overflow-hidden group"
      style={{
        background: "linear-gradient(135deg, var(--color-surface), #111c22)",
        borderColor: "var(--color-border-d)",
      }}
    >
      {/* Decorative background icon */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity pointer-events-none">
        <Zap className="w-24 h-24" style={{ color: "var(--color-primary)" }} />
      </div>

      <div className="relative z-10">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span style={{ color: "#fbbf24" }}>💡</span>
          バッテリーの賢い使い方
        </h3>

        <div className="flex flex-col gap-4">
          {BATTERY_TIPS.map((tip) => (
            <div key={tip.title} className="flex gap-3 items-start">
              <div
                className="p-1.5 rounded shrink-0 mt-0.5"
                style={{
                  background: "var(--color-border-d)",
                  color: "var(--color-primary)",
                }}
              >
                {tip.icon}
              </div>
              <div>
                <p className="text-sm font-bold mb-0.5">{tip.title}</p>
                <p className="text-xs" style={{ color: "var(--color-txt-dim)" }}>
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}

          <button
            className="mt-2 w-full py-2 text-sm font-medium rounded-lg transition-colors border text-center"
            style={{
              borderColor: "var(--color-border-d2)",
              color: "var(--color-primary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--color-border-d)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            すべての推奨事項を見る
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analysis logs table
// Uses mock data seeded from real odometer/range for realism.
// TODO: Replace with real historical battery analysis records from DB.
// ---------------------------------------------------------------------------

interface AnalysisLog {
  date: string;
  rangeKm: number;
  odometerKm: number;
  efficiencyWhKm: number;
  tempC: number;
  status: "Healthy" | "Monitor" | "Warning";
}

function buildMockLogs(maxRangeKm: number, odometerKm: number): AnalysisLog[] {
  const now = new Date();
  return [
    {
      date: new Date(now.getTime() - 7 * 86400000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      rangeKm: maxRangeKm,
      odometerKm,
      efficiencyWhKm: 148,
      tempC: 18,
      status: "Healthy",
    },
    {
      date: new Date(now.getTime() - 21 * 86400000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      rangeKm: maxRangeKm - 1,
      odometerKm: odometerKm - 365,
      efficiencyWhKm: 152,
      tempC: 21,
      status: "Healthy",
    },
    {
      date: new Date(now.getTime() - 35 * 86400000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      rangeKm: maxRangeKm + 1,
      odometerKm: odometerKm - 1090,
      efficiencyWhKm: 165,
      tempC: 24,
      status: "Healthy",
    },
  ];
}

function statusBadge(status: AnalysisLog["status"]) {
  const styles: Record<
    AnalysisLog["status"],
    { bg: string; text: string; label: string }
  > = {
    Healthy: {
      bg: "rgba(34, 197, 94, 0.15)",
      text: "#22c55e",
      label: "良好",
    },
    Monitor: {
      bg: "rgba(245, 158, 11, 0.15)",
      text: "#f59e0b",
      label: "要観察",
    },
    Warning: {
      bg: "rgba(239, 68, 68, 0.15)",
      text: "#ef4444",
      label: "警告",
    },
  };
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

interface AnalysisTableProps {
  logs: AnalysisLog[];
}

function AnalysisTable({ logs }: AnalysisTableProps) {
  return (
    <section className="mt-4">
      <h2 className="text-2xl font-bold mb-5">最近の分析ログ</h2>
      <div
        className="overflow-x-auto rounded-xl border"
        style={{ borderColor: "var(--color-border-d)" }}
      >
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr
              style={{
                background: "var(--color-surface)",
                color: "var(--color-txt-mut)",
              }}
            >
              {["日付", "航続距離(100%)", "走行距離", "効率", "平均気温", "ステータス"].map(
                (h) => (
                  <th key={h} className="px-6 py-4 font-medium">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr
                key={idx}
                className="transition-colors border-t"
                style={{ borderColor: "var(--color-border-d)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background =
                    "rgba(26, 44, 53, 0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background =
                    "transparent";
                }}
              >
                <td className="px-6 py-4 font-medium">{log.date}</td>
                <td className="px-6 py-4">{log.rangeKm} km</td>
                <td className="px-6 py-4">
                  {log.odometerKm.toLocaleString()} km
                </td>
                <td
                  className="px-6 py-4"
                  style={{
                    color:
                      log.efficiencyWhKm <= 155
                        ? "var(--color-ok)"
                        : "var(--color-warn)",
                  }}
                >
                  {log.efficiencyWhKm} Wh/km
                </td>
                <td
                  className="px-6 py-4"
                  style={{ color: "var(--color-txt-sec)" }}
                >
                  {log.tempC}°C
                </td>
                <td className="px-6 py-4">{statusBadge(log.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
        <p style={{ color: "var(--color-txt-mut)" }}>
          バッテリーデータを読み込み中...
        </p>
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
        <p className="font-semibold">バッテリーデータの読み込みに失敗</p>
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

export default function BatteryPage() {
  const { state, isRefreshing, refresh } = useTeslaData();
  const [timeRange, setTimeRange] = useState("過去12ヶ月");

  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState message={state.message} />;

  const { vehicleData } = state.data;
  const { charge_state, vehicle_state } = vehicleData;

  const rangeKm = Math.round(charge_state.battery_range * MILES_TO_KM);
  const odometerKm = Math.round(vehicle_state.odometer * MILES_TO_KM);

  // Derived metrics
  const maxRangeKm = estimateMaxRangeKm(charge_state.battery_level, rangeKm);
  const degradation = estimateDegradation(maxRangeKm);
  const cycleCount = estimateCycleCounts(odometerKm);
  const avgChargePct = charge_state.charge_limit_soc;

  // Mock analysis logs using real odometer/range as anchor
  // TODO: Replace with real historical DB records.
  const analysisLogs = buildMockLogs(maxRangeKm, odometerKm);

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1
            className="text-3xl md:text-4xl font-black leading-tight"
            style={{ letterSpacing: "-0.033em" }}
          >
            バッテリーヘルス分析
          </h1>
          <p className="text-base max-w-2xl" style={{ color: "var(--color-txt-dim)" }}>
            Teslaバッテリーの性能と経年劣化に関する詳細な分析。ソフトウェアバージョン{" "}
            <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
              v{vehicle_state.car_version}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border-d)",
              color: "var(--color-txt-mut)",
            }}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            style={{
              background: "rgba(19, 164, 236, 0.1)",
              color: "var(--color-primary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(19, 164, 236, 0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(19, 164, 236, 0.1)";
            }}
          >
            <Download className="w-4 h-4" />
            レポート出力
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <section
        aria-label="Key Battery Metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Degradation */}
        <MetricCard
          label="劣化率"
          icon={
            <TrendingDown className="w-5 h-5" style={{ color: "#fa5f38" }} />
          }
          value={
            <p className="text-4xl font-bold leading-tight">{degradation}%</p>
          }
          trend={
            <p className="text-sm font-medium" style={{ color: "var(--color-ok)" }}>
              -0.1%
            </p>
          }
          subtitle="フリートの85%より良好"
        />

        {/* Est. Max Range */}
        <MetricCard
          label="推定最大航続距離"
          icon={
            <Ruler className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          }
          value={
            <p className="text-4xl font-bold leading-tight">
              {maxRangeKm}{" "}
              <span
                className="text-xl font-normal"
                style={{ color: "var(--color-txt-mut)" }}
              >
                km
              </span>
            </p>
          }
          trend={
            <p className="text-sm font-medium" style={{ color: "var(--color-ok)" }}>
              +2 km
            </p>
          }
          subtitle="先月平均比"
        />

        {/* Avg Charge */}
        <MetricCard
          label="平均充電量"
          icon={
            <BatteryCharging
              className="w-5 h-5"
              style={{ color: "var(--color-warn)" }}
            />
          }
          value={
            <p className="text-4xl font-bold leading-tight">{avgChargePct}%</p>
          }
          trend={
            <p
              className="text-sm font-medium"
              style={{
                color:
                  avgChargePct > 80
                    ? "var(--color-danger)"
                    : "var(--color-txt-mut)",
              }}
            >
              {avgChargePct > 80 ? "最適値を超過" : "-2%"}
            </p>
          }
          subtitle="最適範囲: 60-80%"
        />

        {/* Cycle Count */}
        <MetricCard
          label="サイクル数"
          icon={
            <RefreshCw className="w-5 h-5" style={{ color: "#a855f7" }} />
          }
          value={
            <p className="text-4xl font-bold leading-tight">{cycleCount}</p>
          }
          trend={
            <p className="text-sm font-medium" style={{ color: "var(--color-txt-mut)" }}>
              +12
            </p>
          }
          subtitle="累計充放電サイクル"
        />
      </section>

      {/* Chart + Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Range Degradation Trend Chart */}
        <section className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold leading-tight">
              航続距離の劣化推移
            </h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm rounded-lg p-2 border focus:outline-none focus:ring-1"
              style={{
                background: "transparent",
                borderColor: "var(--color-border-d2)",
                color: "var(--color-txt)",
              }}
            >
              <option>過去12ヶ月</option>
              <option>全期間</option>
              <option>年初来</option>
            </select>
          </div>
          <RangeTrendChart maxRangeKm={maxRangeKm} />
        </section>

        {/* Side column: Fleet Comparison + Tips */}
        <section className="flex flex-col gap-6">
          <FleetComparison degradation={degradation} />
          <BatteryTips />
        </section>
      </div>

      {/* Analysis Logs Table */}
      <AnalysisTable logs={analysisLogs} />
    </div>
  );
}
