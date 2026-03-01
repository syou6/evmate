"use client";

import { useMemo } from "react";
import {
  Thermometer,
  Gauge,
  Zap,
  Lock,
  Wind,
  Package,
  RefreshCw,
  Power,
  Loader2,
  AlertTriangle,
  WifiOff,
  BatteryCharging,
  Moon,
  CheckCircle2,
} from "lucide-react";
import { useTeslaData } from "@/hooks/useTeslaData";
import { useChargingHistory } from "@/hooks/useChargingHistory";
import { useDrivingTrips } from "@/hooks/useDrivingTrips";

const MILES_TO_KM = 1.60934;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCacheAge(cachedAt: string | null): string {
  if (!cachedAt) return "不明";
  const ageMs = Date.now() - new Date(cachedAt).getTime();
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  return `${hours}時間前`;
}

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  const timeStr = d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (diffDays === 0) return `今日 ${timeStr}`;
  if (diffDays === 1) return `昨日 ${timeStr}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${timeStr}`;
}

function formatTripDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── Circular Battery Gauge ───────────────────────────────────────────────────

interface BatteryGaugeProps {
  level: number;
  isCharging: boolean;
}

function CircularBatteryGauge({ level, isCharging }: BatteryGaugeProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (level / 100) * circumference;

  const gaugeColor =
    level <= 15
      ? "var(--color-danger)"
      : level <= 30
        ? "var(--color-warn)"
        : isCharging
          ? "var(--color-secondary)"
          : "var(--color-primary)";

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg
        className="absolute h-full w-full -rotate-90"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="var(--color-border-d)"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={gaugeColor}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>

      <div className="relative flex flex-col items-center">
        <span
          className="text-4xl font-bold"
          style={{ color: "var(--color-txt)", fontFamily: "var(--font-display)" }}
        >
          {level}%
        </span>
        <span
          className="text-xs font-medium uppercase tracking-widest mt-1"
          style={{ color: "var(--color-txt-mut)" }}
        >
          バッテリー
        </span>
        {isCharging && (
          <Zap
            className="w-3.5 h-3.5 mt-1 animate-charge"
            style={{ color: "var(--color-secondary)" }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Quick Control Button ─────────────────────────────────────────────────────

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function ControlButton({ icon, label, active = false }: ControlButtonProps) {
  return (
    <button
      className="group flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-colors"
      style={{
        background: active
          ? "rgba(19, 164, 236, 0.12)"
          : "var(--color-bg)",
        border: `1px solid ${active ? "rgba(19,164,236,0.3)" : "var(--color-border-d)"}`,
      }}
      aria-label={label}
    >
      <span
        style={{
          color: active ? "var(--color-primary)" : "var(--color-txt-mut)",
          transition: "color 0.2s",
        }}
        className="group-hover:[color:var(--color-primary)]"
      >
        {icon}
      </span>
      <span
        className="text-xs font-medium group-hover:[color:var(--color-txt)]"
        style={{ color: active ? "var(--color-txt)" : "var(--color-txt-mut)" }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Efficiency Bar Chart ─────────────────────────────────────────────────────

interface EfficiencyBarProps {
  label: string;
  value: number;
  maxValue: number;
  isLatest?: boolean;
}

function EfficiencyBar({
  label,
  value,
  maxValue,
  isLatest = false,
}: EfficiencyBarProps) {
  const heightPct = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="group relative flex w-full flex-col items-center justify-end gap-1">
      {/* Tooltip */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
        style={{
          background: "var(--color-surface-hi)",
          color: "var(--color-txt)",
          border: "1px solid var(--color-border-d)",
        }}
      >
        {value} Wh/km
      </div>

      {/* Bar */}
      <div
        className="w-full rounded-t-sm transition-all duration-500"
        style={{
          height: `${Math.max(heightPct, 4)}%`,
          background: isLatest
            ? "var(--color-primary)"
            : "var(--color-surface-hi)",
          minHeight: "4px",
        }}
      />

      {/* Label */}
      <span
        className="text-[10px] text-center"
        style={{
          color: isLatest ? "var(--color-txt)" : "var(--color-txt-mut)",
          fontWeight: isLatest ? 600 : 400,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function VehicleStatusBadge({
  isAsleep,
  isOnline,
}: {
  isAsleep: boolean;
  isOnline: boolean;
}) {
  if (isAsleep) {
    return (
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
        style={{
          background: "rgba(245, 158, 11, 0.1)",
          color: "var(--color-warn)",
        }}
      >
        <Moon className="w-3 h-3" />
        スリープ中
      </div>
    );
  }
  if (isOnline) {
    return (
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
        style={{
          background: "rgba(34, 197, 94, 0.1)",
          color: "var(--color-ok)",
        }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: "var(--color-ok)" }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: "var(--color-ok)" }}
          />
        </span>
        オンライン
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        background: "rgba(100, 116, 139, 0.1)",
        color: "var(--color-txt-mut)",
      }}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      オフライン
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { state, isRefreshing, isWaking, refresh, wakeVehicle } =
    useTeslaData();

  const vehicleDbId =
    state.status === "success" ? String(state.data.vehicle.id) : null;

  const { sessions, isLoading: sessionsLoading } =
    useChargingHistory(vehicleDbId);
  const { trips, isLoading: tripsLoading } = useDrivingTrips(vehicleDbId);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state.status === "loading") {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="読み込み中"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "var(--color-primary)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-txt-mut)" }}>
            車両データを取得中...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state.status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <AlertTriangle
              className="w-6 h-6"
              style={{ color: "var(--color-danger)" }}
            />
          </div>
          <h2
            className="text-lg font-bold mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            データ取得エラー
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--color-txt-mut)" }}
          >
            {state.message}
          </p>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              background: "var(--color-primary)",
              color: "#fff",
            }}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            再試行
          </button>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  const { vehicle, vehicleData } = state.data;
  const charge_state = vehicleData.charge_state ?? {};
  const vehicle_state = vehicleData.vehicle_state ?? {};
  const climate_state = vehicleData.climate_state ?? {};

  const isCharging = charge_state.charging_state === "Charging";
  const isAsleep = state.vehicleAsleep || vehicle.state === "asleep";
  const isOnline = vehicle.state === "online" && !isAsleep;

  const rangeKm = Math.round((charge_state.battery_range ?? 0) * MILES_TO_KM);
  const odometerKm = Math.round((vehicle_state.odometer ?? 0) * MILES_TO_KM);

  const displayName =
    vehicleData.display_name ||
    vehicle_state.vehicle_name ||
    vehicle.display_name;
  const vinShort = vehicleData.vin
    ? `${vehicleData.vin.slice(0, 4)}...${vehicleData.vin.slice(-4)}`
    : "—";

  const vehicleStatus = isCharging
    ? "充電中"
    : isAsleep
      ? "スリープ"
      : isOnline
        ? "オンライン"
        : "オフライン";

  const cacheLabel = state.cached
    ? `キャッシュ: ${formatCacheAge(state.cachedAt)}`
    : `最終更新: ${formatCacheAge(state.cachedAt || new Date().toISOString())}`;

  return (
    <div className="animate-in">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ color: "var(--color-txt)", fontFamily: "var(--font-display)" }}
          >
            ダッシュボード
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-txt-mut)" }}>
            リアルタイムの車両ステータスと分析
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <VehicleStatusBadge isAsleep={isAsleep} isOnline={isOnline} />

          <span className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
            {cacheLabel}
          </span>

          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-d)",
              color: "var(--color-txt-mut)",
            }}
            aria-label="更新"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            更新
          </button>
        </div>
      </header>

      {/* ── Asleep Banner ────────────────────────────────────────────────── */}
      {isAsleep && (
        <div
          className="mb-6 flex items-center justify-between gap-4 rounded-2xl p-4"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <div className="flex items-center gap-3">
            <WifiOff
              className="w-4 h-4 shrink-0"
              style={{ color: "var(--color-warn)" }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-txt)" }}>
                車両がスリープ中です
              </p>
              <p className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
                表示データはキャッシュです（{formatCacheAge(state.cachedAt)}）
              </p>
            </div>
          </div>

          <button
            onClick={() => wakeVehicle(vehicle.id)}
            disabled={isWaking}
            className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-50"
            style={{
              background: "var(--color-warn)",
              color: "#000",
            }}
          >
            {isWaking ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                起動中...
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5" />
                起動する
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Car Status Card (large) ──────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div
            className="relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-2xl p-6"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-d)",
            }}
          >
            {/* Background accent graphic */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-2/3 opacity-5">
              <svg className="h-full w-full" viewBox="0 0 400 200" aria-hidden="true">
                <path
                  d="M20,150 Q50,150 60,130 L100,60 Q120,30 160,30 L280,30 Q320,30 340,60 L380,130 Q390,150 380,170 H40"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="relative z-10 flex flex-1 flex-col justify-between">
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: "var(--color-txt)", fontFamily: "var(--font-display)" }}
                  >
                    {displayName}
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: "var(--color-txt-mut)" }}>
                    VIN: {vinShort}
                  </p>
                </div>

                {/* Wake button only if sleeping */}
                {isAsleep && !isWaking && (
                  <button
                    onClick={() => wakeVehicle(vehicle.id)}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-lg transition-all"
                    style={{
                      background: "var(--color-primary)",
                      color: "#fff",
                      boxShadow: "0 4px 14px rgba(19,164,236,0.25)",
                    }}
                  >
                    <Power className="w-4 h-4" />
                    起動する
                  </button>
                )}

                {/* Charging indicator */}
                {isCharging && (
                  <div
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold"
                    style={{
                      background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      color: "var(--color-ok)",
                    }}
                  >
                    <BatteryCharging className="w-4 h-4 animate-charge" />
                    充電中 {charge_state.charger_power}kW
                  </div>
                )}
              </div>

              {/* Circular gauge */}
              <div className="mt-6 flex flex-col items-center justify-center gap-4 py-4">
                <CircularBatteryGauge
                  level={charge_state.battery_level ?? 0}
                  isCharging={isCharging}
                />

                <div className="flex flex-col items-center">
                  <span
                    className="text-2xl font-semibold"
                    style={{ color: "var(--color-txt)", fontFamily: "var(--font-display)" }}
                  >
                    {rangeKm.toLocaleString()} km
                  </span>
                  <span className="text-sm mt-0.5" style={{ color: "var(--color-txt-mut)" }}>
                    推定航続距離
                  </span>
                </div>
              </div>

              {/* Bottom stats row */}
              <div
                className="mt-auto grid grid-cols-3 gap-4 border-t pt-5"
                style={{ borderColor: "var(--color-border-d)" }}
              >
                {/* Interior temp */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
                    車内温度
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Thermometer
                      className="w-4 h-4"
                      style={{ color: "var(--color-primary)" }}
                    />
                    <span
                      className="text-lg font-semibold"
                      style={{ color: "var(--color-txt)", fontFamily: "var(--font-display)" }}
                    >
                      {climate_state.inside_temp != null
                        ? `${climate_state.inside_temp.toFixed(1)}°C`
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Odometer */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
                    走行距離計
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Gauge
                      className="w-4 h-4"
                      style={{ color: "var(--color-primary)" }}
                    />
                    <span
                      className="text-lg font-semibold"
                      style={{ color: "var(--color-txt)", fontFamily: "var(--font-display)" }}
                    >
                      {odometerKm.toLocaleString()} km
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
                    ステータス
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isCharging ? (
                      <BatteryCharging
                        className="w-4 h-4"
                        style={{ color: "var(--color-primary)" }}
                      />
                    ) : isAsleep ? (
                      <Moon
                        className="w-4 h-4"
                        style={{ color: "var(--color-primary)" }}
                      />
                    ) : (
                      <CheckCircle2
                        className="w-4 h-4"
                        style={{ color: "var(--color-primary)" }}
                      />
                    )}
                    <span
                      className="text-lg font-semibold"
                      style={{ color: "var(--color-txt)", fontFamily: "var(--font-display)" }}
                    >
                      {vehicleStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Quick Controls */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-d)",
            }}
          >
            <h3
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-txt-mut)" }}
            >
              クイックコントロール
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <ControlButton
                icon={<Lock className="w-5 h-5" />}
                label="ロック"
                active={vehicle_state.locked}
              />
              <ControlButton
                icon={<Wind className="w-5 h-5" />}
                label="エアコン"
                active={climate_state.is_climate_on}
              />
              <ControlButton
                icon={<Zap className="w-5 h-5" />}
                label="充電ポート"
                active={charge_state.charge_port_door_open}
              />
              <ControlButton
                icon={<Package className="w-5 h-5" />}
                label="フランク"
              />
            </div>
          </div>

          {/* Charge info card */}
          <div
            className="rounded-2xl p-6 flex-1"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-d)",
            }}
          >
            <h3
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-txt-mut)" }}
            >
              充電情報
            </h3>

            <div className="flex flex-col gap-4">
              {/* Charge limit bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--color-txt-mut)" }}>充電上限</span>
                  <span style={{ color: "var(--color-txt)" }}>
                    {charge_state.charge_limit_soc}%
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full overflow-hidden"
                  style={{ background: "var(--color-bg)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${charge_state.charge_limit_soc}%`,
                      background: "var(--color-border-d2)",
                    }}
                  />
                  <div
                    className="h-full rounded-full -mt-2 transition-all duration-700"
                    style={{
                      width: `${charge_state.battery_level}%`,
                      background: isCharging
                        ? "var(--color-secondary)"
                        : "var(--color-primary)",
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              {[
                {
                  label: "充電状態",
                  value:
                    charge_state.charging_state === "Charging"
                      ? "充電中"
                      : charge_state.charging_state === "Complete"
                        ? "完了"
                        : charge_state.charging_state === "Disconnected"
                          ? "未接続"
                          : "停止",
                },
                {
                  label: "外気温",
                  value:
                    climate_state.outside_temp != null
                      ? `${climate_state.outside_temp.toFixed(1)}°C`
                      : "—",
                },
                {
                  label: "ソフトウェア",
                  value: vehicle_state.car_version
                    ? `v${vehicle_state.car_version}`
                    : "—",
                },
                {
                  label: "セントリーモード",
                  value: vehicle_state.sentry_mode ? "有効" : "無効",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--color-txt-mut)" }}>
                    {item.label}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-txt)" }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}

              {/* Minutes to full — only when charging */}
              {isCharging && (charge_state.minutes_to_full_charge ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--color-txt-mut)" }}>
                    完了まで
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-ok)" }}
                  >
                    {charge_state.minutes_to_full_charge}分
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Statistics Row ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Charging History */}
            <ChargingHistoryCard sessions={sessions} isLoading={sessionsLoading} />

            {/* Driving Efficiency */}
            <DrivingEfficiencyCard trips={trips} isLoading={tripsLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Charging History Card ────────────────────────────────────────────────────

interface ChargingSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  energy_added_kwh: number | null;
  start_battery_level: number | null;
  end_battery_level: number | null;
  charging_type: string | null;
  location_name: string | null;
}

function ChargingHistoryCard({
  sessions,
  isLoading,
}: {
  sessions: ChargingSession[];
  isLoading: boolean;
}) {
  const recentSessions = sessions.slice(0, 4);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-d)",
      }}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3
          className="text-lg font-semibold"
          style={{ color: "var(--color-txt)", fontFamily: "var(--font-display)" }}
        >
          充電履歴
        </h3>
        <span className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
          直近{recentSessions.length}件
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : recentSessions.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm" style={{ color: "var(--color-txt-mut)" }}>
            充電履歴がありません
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentSessions.map((session) => {
            const isSupercharger =
              session.charging_type === "dc_fast" ||
              (session.charging_type?.toLowerCase().includes("dc") ?? false);

            return (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl p-3 transition-colors"
                style={{ background: "var(--color-bg)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: isSupercharger
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(19,164,236,0.1)",
                    }}
                  >
                    {isSupercharger ? (
                      <Zap
                        className="w-5 h-5"
                        style={{ color: "var(--color-ok)" }}
                      />
                    ) : (
                      <BatteryCharging
                        className="w-5 h-5"
                        style={{ color: "var(--color-primary)" }}
                      />
                    )}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--color-txt)" }}
                    >
                      {session.location_name ||
                        (isSupercharger ? "スーパーチャージャー" : "ホーム充電")}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
                      {formatSessionDate(session.started_at)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--color-txt)" }}
                  >
                    +{(session.energy_added_kwh ?? 0).toFixed(1)} kWh
                  </p>
                  {session.start_battery_level != null &&
                    session.end_battery_level != null && (
                      <p className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
                        {session.start_battery_level}% → {session.end_battery_level}%
                      </p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Driving Efficiency Card ──────────────────────────────────────────────────

interface DrivingTrip {
  id: string;
  started_at: string;
  ended_at: string | null;
  distance_km: number | null;
  efficiency_wh_per_km: number | null;
  avg_speed_kmh: number | null;
  energy_used_kwh: number | null;
}

function DrivingEfficiencyCard({
  trips,
  isLoading,
}: {
  trips: DrivingTrip[];
  isLoading: boolean;
}) {
  const recentTrips = trips.slice(0, 7);

  const avgEfficiency = useMemo(() => {
    const valid = recentTrips.filter(
      (t) => t.efficiency_wh_per_km != null && t.efficiency_wh_per_km > 0
    );
    if (valid.length === 0) return null;
    const sum = valid.reduce(
      (acc, t) => acc + (t.efficiency_wh_per_km ?? 0),
      0
    );
    return Math.round(sum / valid.length);
  }, [recentTrips]);

  const maxEfficiency = useMemo(
    () =>
      Math.max(
        ...recentTrips.map((t) => t.efficiency_wh_per_km ?? 0),
        1
      ),
    [recentTrips]
  );

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-d)",
      }}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3
          className="text-lg font-semibold"
          style={{ color: "var(--color-txt)", fontFamily: "var(--font-display)" }}
        >
          走行効率
        </h3>
        {avgEfficiency != null && (
          <span className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
            平均: {avgEfficiency} Wh/km
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="skeleton h-40 w-full rounded-lg" />
      ) : recentTrips.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm" style={{ color: "var(--color-txt-mut)" }}>
            走行データがありません
          </p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="flex h-36 items-end justify-between gap-2">
            {recentTrips.map((trip, index) => {
              const isLatest = index === recentTrips.length - 1;
              return (
                <EfficiencyBar
                  key={trip.id}
                  label={formatTripDate(trip.started_at)}
                  value={Math.round(trip.efficiency_wh_per_km ?? 0)}
                  maxValue={maxEfficiency}
                  isLatest={isLatest}
                />
              );
            })}
          </div>

          {/* Trip summary list (2 most recent) */}
          <div
            className="mt-4 space-y-2 border-t pt-4"
            style={{ borderColor: "var(--color-border-d)" }}
          >
            {recentTrips.slice(-2).reverse().map((trip) => (
              <div key={trip.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--color-primary)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
                    {formatTripDate(trip.started_at)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span style={{ color: "var(--color-txt)" }}>
                    {(trip.distance_km ?? 0).toFixed(1)} km
                  </span>
                  {trip.efficiency_wh_per_km != null && (
                    <span style={{ color: "var(--color-txt-mut)" }}>
                      {Math.round(trip.efficiency_wh_per_km)} Wh/km
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
