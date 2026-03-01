"use client";

import { useMemo, useState } from "react";
import {
  BarChart2,
  PieChart,
  Download,
  CalendarDays,
  Moon,
  Clock,
  Sun,
  Home,
  Zap,
  MapPin,
  Receipt,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { useTeslaData } from "@/hooks/useTeslaData";
import { useChargingHistory } from "@/hooks/useChargingHistory";
import { Tables } from "@/types/database";

type ChargingSession = Tables<"charging_sessions">;

// ── Cost calculation helpers ─────────────────────────────────────────────────

const RATE_SUPERCHARGER = 75; // ¥/kWh
const RATE_STANDARD = 31.5; // ¥/kWh
const RATE_NIGHT = 18.2; // ¥/kWh  (01:00–06:00)

function isNightHour(isoDate: string): boolean {
  const hour = new Date(isoDate).getHours();
  return hour >= 1 && hour < 6;
}

function calcCost(session: ChargingSession): number {
  const kwh = session.energy_added_kwh ?? 0;
  const type = (session.charging_type ?? "").toLowerCase();

  if (type.includes("super") || type.includes("dc")) {
    return Math.round(kwh * RATE_SUPERCHARGER);
  }
  if (isNightHour(session.started_at)) {
    return Math.round(kwh * RATE_NIGHT);
  }
  return Math.round(kwh * RATE_STANDARD);
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "—";
  const diffMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalMin = Math.round(diffMs / 60000);
  if (totalMin < 60) return `${totalMin}分`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ── Charge-type helpers ──────────────────────────────────────────────────────

type ChargeCategory = "home" | "supercharger" | "destination";

function categorise(charging_type: string | null): ChargeCategory {
  const t = (charging_type ?? "").toLowerCase();
  if (t.includes("super") || t.includes("dc")) return "supercharger";
  if (t.includes("dest") || t.includes("hotel") || t.includes("ac_public"))
    return "destination";
  return "home";
}

const BADGE: Record<ChargeCategory, { label: string; className: string }> = {
  home: {
    label: "AC自宅",
    className:
      "bg-primary/10 text-primary border border-primary/20",
  },
  supercharger: {
    label: "スーパーチャージャー",
    className:
      "bg-violet-500/10 text-violet-300 border border-violet-500/20",
  },
  destination: {
    label: "目的地充電",
    className:
      "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  },
};

const LOCATION_ICON: Record<ChargeCategory, React.ReactNode> = {
  home: <Home className="w-3.5 h-3.5" />,
  supercharger: <Zap className="w-3.5 h-3.5" />,
  destination: <MapPin className="w-3.5 h-3.5" />,
};

// ── Monthly aggregation ──────────────────────────────────────────────────────

interface MonthBucket {
  label: string;
  cost: number;
  kwh: number;
}

function buildMonthBuckets(sessions: ChargingSession[]): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("ja-JP", { month: "short" });
    buckets.push({ label, cost: 0, kwh: 0 });
  }

  for (const s of sessions) {
    const d = new Date(s.started_at);
    const monthsAgo =
      (now.getFullYear() - d.getFullYear()) * 12 +
      now.getMonth() -
      d.getMonth();

    if (monthsAgo >= 0 && monthsAgo < 6) {
      const idx = 5 - monthsAgo;
      buckets[idx].cost += calcCost(s);
      buckets[idx].kwh += s.energy_added_kwh ?? 0;
    }
  }

  return buckets;
}

// ── Energy-source breakdown ──────────────────────────────────────────────────

interface SourceBreakdown {
  home: number;
  supercharger: number;
  destination: number;
  totalKwh: number;
}

function buildSourceBreakdown(sessions: ChargingSession[]): SourceBreakdown {
  let home = 0;
  let supercharger = 0;
  let destination = 0;

  for (const s of sessions) {
    const kwh = s.energy_added_kwh ?? 0;
    const cat = categorise(s.charging_type);
    if (cat === "home") home += kwh;
    else if (cat === "supercharger") supercharger += kwh;
    else destination += kwh;
  }

  const totalKwh = home + supercharger + destination;
  return { home, supercharger, destination, totalKwh };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

interface MonthlyChartProps {
  buckets: MonthBucket[];
}

function MonthlyChart({ buckets }: MonthlyChartProps) {
  const maxCost = Math.max(...buckets.map((b) => b.cost), 1);
  const current = buckets[buckets.length - 1];
  const previous = buckets[buckets.length - 2];
  const trendPct =
    previous && previous.cost > 0
      ? Math.round(((current.cost - previous.cost) / previous.cost) * 100)
      : null;

  return (
    <div
      className="rounded-xl border border-border-d bg-surface p-6 flex flex-col"
      style={{ minHeight: 340 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-txt-mut">
            合計コスト ({current.label})
          </p>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl font-bold text-txt tracking-tight">
              ¥{current.cost.toLocaleString()}
            </span>
            {trendPct !== null && (
              <div
                className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded ${
                  trendPct >= 0
                    ? "bg-ok/10 text-ok"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {trendPct >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trendPct >= 0 ? "+" : ""}
                {trendPct}%
              </div>
            )}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-surface-hi">
          <BarChart2 className="w-5 h-5 text-txt-mut" />
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex-1 flex items-end justify-between gap-2 h-48 px-1">
        {buckets.map((b, idx) => {
          const isCurrentMonth = idx === buckets.length - 1;
          const heightPct = maxCost > 0 ? (b.cost / maxCost) * 100 : 0;

          return (
            <div
              key={b.label}
              className="flex flex-col items-center gap-2 w-full group cursor-pointer"
            >
              <div className="relative w-full h-48 flex items-end">
                {isCurrentMonth && b.cost > 0 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-hi border border-border-d text-txt text-xs font-bold py-1 px-2 rounded whitespace-nowrap z-10 shadow-lg">
                    ¥{b.cost.toLocaleString()}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-hi border-r border-b border-border-d rotate-45" />
                  </div>
                )}
                <div
                  className={`w-full rounded-t-sm transition-colors ${
                    isCurrentMonth
                      ? "bg-surface-hi ring-2 ring-primary ring-offset-1 ring-offset-surface"
                      : "bg-surface-hi hover:bg-border-d2"
                  }`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                >
                  <div
                    className={`w-full h-full rounded-t-sm ${
                      isCurrentMonth
                        ? "bg-primary"
                        : "bg-primary/40 group-hover:bg-primary/60"
                    } transition-colors`}
                  />
                </div>
              </div>
              <span
                className={`text-xs font-bold ${
                  isCurrentMonth
                    ? "text-primary"
                    : "text-txt-mut"
                }`}
              >
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EnergySourceProps {
  breakdown: SourceBreakdown;
}

function EnergySource({ breakdown }: EnergySourceProps) {
  const { home, supercharger, destination, totalKwh } = breakdown;

  const homePct = totalKwh > 0 ? Math.round((home / totalKwh) * 100) : 0;
  const superPct =
    totalKwh > 0 ? Math.round((supercharger / totalKwh) * 100) : 0;
  const destPct = totalKwh > 0 ? Math.round((destination / totalKwh) * 100) : 0;

  const conicGradient =
    totalKwh > 0
      ? `conic-gradient(
          var(--color-primary) 0% ${homePct}%,
          #8b5cf6 ${homePct}% ${homePct + superPct}%,
          #f59e0b ${homePct + superPct}% 100%
        )`
      : `conic-gradient(var(--color-border-d) 0% 100%)`;

  return (
    <div
      className="rounded-xl border border-border-d bg-surface p-6 flex flex-col"
      style={{ minHeight: 340 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-txt-mut">
            エネルギー源
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-txt tracking-tight">
              {Math.round(totalKwh)}
            </span>
            <span className="text-xl font-medium text-txt-mut">
              kWh
            </span>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-surface-hi">
          <PieChart className="w-5 h-5 text-txt-mut" />
        </div>
      </div>

      {/* Donut + legend */}
      <div className="flex-1 flex flex-col sm:flex-row items-center gap-8">
        {/* Donut */}
        <div
          className="relative size-40 sm:size-44 rounded-full shrink-0"
          style={{ background: conicGradient }}
        >
          <div className="absolute inset-0 m-auto rounded-full bg-surface flex flex-col items-center justify-center size-28 sm:size-32">
            <span className="text-xs text-txt-mut font-medium">
              合計
            </span>
            <span className="text-xl font-bold text-txt">
              100%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 w-full">
          {[
            {
              label: "自宅充電",
              color: "bg-primary",
              pct: homePct,
            },
            {
              label: "スーパーチャージャー",
              color: "bg-violet-500",
              pct: superPct,
            },
            {
              label: "目的地充電",
              color: "bg-amber-500",
              pct: destPct,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-hi/40"
            >
              <div className="flex items-center gap-3">
                <div className={`size-3 rounded-full ${item.color}`} />
                <span className="text-sm font-medium text-txt">
                  {item.label}
                </span>
              </div>
              <span className="text-sm font-bold text-txt">
                {item.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SessionsTableProps {
  sessions: ChargingSession[];
  searchQuery: string;
}

function SessionsTable({ sessions, searchQuery }: SessionsTableProps) {
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => {
      const loc = (s.location_name ?? "").toLowerCase();
      const type = (s.charging_type ?? "").toLowerCase();
      return loc.includes(q) || type.includes(q);
    });
  }, [sessions, searchQuery]);

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-txt-mut text-sm">
        充電セッションが見つかりません。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg text-txt-mut font-medium border-b border-border-d">
          <tr>
            <th className="px-6 py-4">日時</th>
            <th className="px-6 py-4">場所</th>
            <th className="px-6 py-4">種別</th>
            <th className="px-6 py-4 text-right">充電量</th>
            <th className="px-6 py-4 text-right">時間</th>
            <th className="px-6 py-4 text-right">コスト（¥）</th>
            <th className="px-6 py-4 text-center">明細</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-d">
          {filtered.map((s) => {
            const cat = categorise(s.charging_type);
            const badge = BADGE[cat];
            const cost = calcCost(s);
            const isSupercharger = cat === "supercharger";

            return (
              <tr
                key={s.id}
                className="hover:bg-surface-hi/40 transition-colors group"
              >
                {/* Date */}
                <td className="px-6 py-4 font-medium text-txt whitespace-nowrap">
                  {formatDate(s.started_at)}
                </td>

                {/* Location */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded bg-surface-hi flex items-center justify-center text-txt-mut">
                      {LOCATION_ICON[cat]}
                    </div>
                    <span className="text-txt-sec truncate max-w-[160px]">
                      {s.location_name ?? "不明な場所"}
                    </span>
                  </div>
                </td>

                {/* Type badge */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </td>

                {/* kWh */}
                <td className="px-6 py-4 text-right text-txt-sec">
                  {(s.energy_added_kwh ?? 0).toFixed(1)} kWh
                </td>

                {/* Duration */}
                <td className="px-6 py-4 text-right text-txt-mut">
                  {formatDuration(s.started_at, s.ended_at)}
                </td>

                {/* Cost */}
                <td className="px-6 py-4 text-right font-bold text-txt">
                  {cost === 0 ? "無料" : `¥${cost.toLocaleString()}`}
                </td>

                {/* Receipt */}
                <td className="px-6 py-4 text-center">
                  {isSupercharger ? (
                    <button
                      className="text-txt-mut hover:text-primary transition-colors"
                      aria-label="View receipt"
                    >
                      <Receipt className="w-4 h-4 mx-auto" />
                    </button>
                  ) : (
                    <span className="text-border-d2">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChargingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { state } = useTeslaData();

  const vehicleDbId =
    state.status === "success" ? String(state.data.vehicle.id) : null;

  const { sessions, isLoading } = useChargingHistory(vehicleDbId);

  const buckets = useMemo(() => buildMonthBuckets(sessions), [sessions]);
  const breakdown = useMemo(() => buildSourceBreakdown(sessions), [sessions]);

  // CSV export
  function handleExportCsv() {
    const rows = [
      ["日時", "場所", "タイプ", "追加kWh", "所要時間(分)", "コスト(円)"],
      ...sessions.map((s) => {
        const diffMin = s.ended_at
          ? Math.round(
              (new Date(s.ended_at).getTime() -
                new Date(s.started_at).getTime()) /
                60000
            )
          : 0;
        return [
          s.started_at,
          s.location_name ?? "",
          s.charging_type ?? "",
          (s.energy_added_kwh ?? 0).toFixed(2),
          String(diffMin),
          String(calcCost(s)),
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "charging-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-txt">
            充電コストと履歴
          </h1>
          <p className="text-txt-mut text-sm">
            月間の充電支出を追跡し、充電習慣を分析。
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hi hover:bg-border-d2 transition-colors text-sm font-medium text-txt-sec">
            <CalendarDays className="w-4 h-4" />
            過去6ヶ月
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-sm font-bold text-white shadow-lg shadow-primary/20"
          >
            <Download className="w-4 h-4" />
            CSVエクスポート
          </button>
        </div>
      </div>

      {/* Charts grid */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyChart buckets={buckets} />
          <EnergySource breakdown={breakdown} />
        </div>
      )}

      {/* Recommended Schedule */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 to-transparent p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-txt mb-2">
              おすすめ充電スケジュール
            </h2>
            <p className="text-txt-sec max-w-xl text-sm leading-relaxed">
              <span className="text-primary font-medium">
                TEPCOスマートライフプラン
              </span>
              に基づく。オフピーク時間帯への充電シフトで月最大¥4,000節約可能。
            </p>
          </div>
          <button className="shrink-0 px-5 py-2.5 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold transition-colors">
            プラン設定を変更
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Best Time */}
          <div className="border-l-4 border-l-ok rounded-r-lg bg-bg p-5 flex items-start gap-4 shadow-sm">
            <div className="p-2 rounded-full bg-ok/10 text-ok shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ok mb-1 block">
                おすすめ時間帯
              </span>
              <h4 className="text-lg font-bold text-txt">
                01:00 – 06:00
              </h4>
              <p className="text-sm text-txt-mut mt-1">
                ¥18.20 / kWh
              </p>
            </div>
          </div>

          {/* Standard */}
          <div className="border-l-4 border-l-warn rounded-r-lg bg-bg p-5 flex items-start gap-4 shadow-sm">
            <div className="p-2 rounded-full bg-warn/10 text-warn shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-warn mb-1 block">
                標準
              </span>
              <h4 className="text-lg font-bold text-txt">
                22:00 – 01:00
              </h4>
              <p className="text-sm text-txt-mut mt-1">
                ¥25.80 / kWh
              </p>
            </div>
          </div>

          {/* Avoid */}
          <div className="border-l-4 border-l-danger rounded-r-lg bg-bg p-5 flex items-start gap-4 shadow-sm opacity-80">
            <div className="p-2 rounded-full bg-danger/10 text-danger shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-danger mb-1 block">
                避けるべき
              </span>
              <h4 className="text-lg font-bold text-txt">
                10:00 – 17:00
              </h4>
              <p className="text-sm text-txt-mut mt-1">
                ¥35.12 / kWh
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions table */}
      <div className="rounded-xl border border-border-d bg-surface overflow-hidden">
        <div className="p-6 border-b border-border-d flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-txt">
            充電セッション
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="場所で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-hi border-none rounded-lg text-sm px-4 py-2 text-txt placeholder-txt-mut focus:ring-2 focus:ring-primary w-48 md:w-64 outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <SessionsTable sessions={sessions} searchQuery={searchQuery} />
        )}

        <div className="p-4 border-t border-border-d flex justify-center">
          <button className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
            すべての履歴を見る
          </button>
        </div>
      </div>
    </div>
  );
}
