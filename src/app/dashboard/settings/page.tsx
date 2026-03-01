"use client";

import { useState } from "react";
import {
  CheckCircle2,
  RefreshCw,
  Unplug,
  BatteryWarning,
  Zap,
  Star,
  Download,
  FileText,
  Clock,
  DollarSign,
  Trash2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useTeslaData } from "@/hooks/useTeslaData";

// ── Toggle switch ─────────────────────────────────────────────────────────────

interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ id, checked, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        checked ? "bg-primary" : "bg-border-d2"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between px-1">
        <h2 className="text-xl font-bold text-txt">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-border-d bg-surface ${className}`}
    >
      {children}
    </div>
  );
}

// ── Rate settings form ────────────────────────────────────────────────────────

interface RateSettings {
  standardRate: string;
  nightRate: string;
  discountStart: string;
  discountEnd: string;
}

interface RateFormProps {
  values: RateSettings;
  onChange: (next: RateSettings) => void;
  onSave: () => void;
  saved: boolean;
}

function RateForm({ values, onChange, onSave, saved }: RateFormProps) {
  const inputCls =
    "w-full bg-bg border border-border-d text-txt text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block pl-10 p-2.5 outline-none placeholder-txt-mut [color-scheme:dark]";

  return (
    <Card className="p-6">
      <p className="text-txt-dim text-sm mb-6">
        正確な充電コストを計算するために電力料金を設定。単位は円。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standard Rate */}
        <div className="flex flex-col gap-2">
          <label className="text-txt-sec text-sm font-medium">
            通常料金（円/kWh）
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-txt-mut">
              <DollarSign className="w-4 h-4" />
            </span>
            <input
              type="number"
              step="0.01"
              className={inputCls}
              placeholder="0.00"
              value={values.standardRate}
              onChange={(e) => onChange({ ...values, standardRate: e.target.value })}
            />
          </div>
        </div>

        {/* Night Rate */}
        <div className="flex flex-col gap-2">
          <label className="text-txt-sec text-sm font-medium">
            夜間割引料金（円/kWh）
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-txt-mut">
              <Zap className="w-4 h-4" />
            </span>
            <input
              type="number"
              step="0.01"
              className={inputCls}
              placeholder="0.00"
              value={values.nightRate}
              onChange={(e) => onChange({ ...values, nightRate: e.target.value })}
            />
          </div>
        </div>

        {/* Discount Start */}
        <div className="flex flex-col gap-2">
          <label className="text-txt-sec text-sm font-medium">
            割引開始時刻
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-txt-mut">
              <Clock className="w-4 h-4" />
            </span>
            <input
              type="time"
              className={inputCls}
              value={values.discountStart}
              onChange={(e) => onChange({ ...values, discountStart: e.target.value })}
            />
          </div>
        </div>

        {/* Discount End */}
        <div className="flex flex-col gap-2">
          <label className="text-txt-sec text-sm font-medium">
            割引終了時刻
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-txt-mut">
              <Clock className="w-4 h-4" />
            </span>
            <input
              type="time"
              className={inputCls}
              value={values.discountEnd}
              onChange={(e) => onChange({ ...values, discountEnd: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onSave}
          className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          {saved && <CheckCircle2 className="w-4 h-4" />}
          {saved ? "保存しました！" : "料金を保存"}
        </button>
      </div>
    </Card>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

interface DeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteModal({ onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-xl border border-danger/30 bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-danger/10 text-danger">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-txt">
            アカウント削除
          </h3>
        </div>
        <p className="text-sm text-txt-sec mb-6">
          この操作は取り消せません。車両データ、充電履歴、設定がすべて完全に削除されます。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-border-d text-txt-sec text-sm font-medium hover:bg-surface-hi transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-danger text-white text-sm font-bold hover:bg-danger/90 transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { state, isRefreshing, refresh } = useTeslaData();

  // Notification toggles
  const [batteryLowAlert, setBatteryLowAlert] = useState(false);
  const [chargeComplete, setChargeComplete] = useState(true);

  // Rate settings
  const [rateSettings, setRateSettings] = useState<RateSettings>({
    standardRate: "31.50",
    nightRate: "18.20",
    discountStart: "23:00",
    discountEnd: "07:00",
  });
  const [rateSaved, setRateSaved] = useState(false);

  function handleSaveRates() {
    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 2500);
  }

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Vehicle info from Tesla data
  const vehicleConnected = state.status === "success";
  const vin =
    state.status === "success" ? state.data.vehicleData.vin : null;
  const displayName =
    state.status === "success"
      ? state.data.vehicleData.display_name ||
        state.data.vehicleData.vehicle_state.vehicle_name
      : null;

  const vinSuffix = vin ? `...${vin.slice(-4)}` : "...????";
  const carLabel = displayName ? `${displayName}に接続中（VIN: ${vinSuffix}）` : `接続中（VIN: ${vinSuffix}）`;

  return (
    <>
      <div className="flex flex-col gap-8 max-w-[960px]">
        {/* Page header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold tracking-tight text-txt">
            設定とアカウント
          </h1>
          <p className="text-txt-dim text-base">
            EV Mateのプロフィール、接続、環境設定を管理。
          </p>
        </div>

        {/* Tesla Account */}
        <Section title="Teslaアカウント">
          <Card>
            <div className="flex items-center gap-4 px-6 py-5 justify-between flex-wrap">
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center justify-center rounded-lg shrink-0 size-12 ${
                    vehicleConnected
                      ? "text-ok bg-ok/10"
                      : "text-txt-mut bg-surface-hi"
                  }`}
                >
                  {state.status === "loading" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-txt text-base font-medium">
                    Tesla API接続
                  </p>
                  <p className="text-txt-dim text-sm">
                    {state.status === "loading"
                      ? "接続中..."
                      : vehicleConnected
                      ? carLabel
                      : "未接続"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={refresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hi text-txt text-sm font-medium hover:bg-border-d2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  トークン更新
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors">
                  <Unplug className="w-4 h-4" />
                  接続解除
                </button>
              </div>
            </div>
          </Card>
        </Section>

        {/* Notifications */}
        <Section title="通知">
          <Card className="divide-y divide-border-d">
            {/* Battery Low */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-start gap-4">
                <div className="text-primary bg-primary/10 flex items-center justify-center rounded-lg shrink-0 size-10">
                  <BatteryWarning className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-txt font-medium">
                    バッテリー低下アラート
                  </p>
                  <p className="text-txt-dim text-sm mt-0.5">
                    バッテリーが20%以下になると通知
                  </p>
                </div>
              </div>
              <Toggle
                id="toggle-battery"
                checked={batteryLowAlert}
                onChange={setBatteryLowAlert}
              />
            </div>

            {/* Charge Complete */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-start gap-4">
                <div className="text-primary bg-primary/10 flex items-center justify-center rounded-lg shrink-0 size-10">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-txt font-medium">
                    充電完了通知
                  </p>
                  <p className="text-txt-dim text-sm mt-0.5">
                    充電完了時にメール通知を受け取る
                  </p>
                </div>
              </div>
              <Toggle
                id="toggle-charge"
                checked={chargeComplete}
                onChange={setChargeComplete}
              />
            </div>
          </Card>
        </Section>

        {/* Electricity Rates */}
        <Section
          title="電力料金設定"
          action={
            <button className="text-primary text-sm font-medium hover:underline">
              過去の料金を見る
            </button>
          }
        >
          <RateForm
            values={rateSettings}
            onChange={setRateSettings}
            onSave={handleSaveRates}
            saved={rateSaved}
          />
        </Section>

        {/* Subscription + Data Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscription */}
          <Section title="サブスクリプション">
            <Card className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-txt font-bold text-lg">
                        EV Mate プロ
                      </h3>
                      <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Pro
                      </span>
                    </div>
                    <p className="text-txt-dim text-sm">
                      2024年1月から利用中
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-bg">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {[
                    "無制限のデータ履歴",
                    "高度なバッテリー分析",
                    "優先サポート",
                  ].map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-2 text-sm text-txt-sec"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <button className="w-full border border-border-d text-txt hover:bg-surface-hi font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                サブスクリプション管理
                <ChevronRight className="w-4 h-4" />
              </button>
            </Card>
          </Section>

          {/* Data Management */}
          <Section title="データ管理">
            <Card className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-txt font-bold text-lg">
                      データエクスポート
                    </h3>
                    <p className="text-txt-dim text-sm mt-1">
                      走行・充電履歴をダウンロード。
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-bg">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <p className="text-txt-mut text-xs mb-6 leading-relaxed">
                  CSV形式でエクスポート。ExcelやGoogle スプレッドシートに対応。充電セッションと効率メトリクスの詳細ログを含みます。
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button className="w-full bg-surface-hi hover:bg-border-d2 text-txt font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                  <FileText className="w-4 h-4" />
                  走行履歴をエクスポート
                </button>
                <button className="w-full bg-surface-hi hover:bg-border-d2 text-txt font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                  <Zap className="w-4 h-4" />
                  充電ログをエクスポート
                </button>
              </div>
            </Card>
          </Section>
        </div>

        {/* Danger Zone */}
        <section className="mb-8">
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-6">
            <h3 className="text-danger font-bold text-lg mb-2">
              アカウント削除
            </h3>
            <p className="text-danger/70 text-sm mb-4">
              一度アカウントを削除すると元に戻せません。よくご確認ください。
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 border border-danger/30 text-danger hover:bg-danger/10 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              アカウントを削除する
            </button>
          </div>
        </section>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={() => {
            setShowDeleteModal(false);
            // No-op: actual deletion would go here
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
