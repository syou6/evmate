"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Zap,
  CheckCircle,
  Check,
  Minus,
  ChevronDown,
} from "lucide-react";

// ── shared data ──────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "ダッシュボード", href: "/dashboard" },
  { label: "充電", href: "#" },
  { label: "走行", href: "#" },
  { label: "料金", href: "/pricing" },
  { label: "設定", href: "#" },
];

const BASIC_FEATURES = [
  "基本ダッシュボード",
  "充電ログ（直近30日）",
  "1台まで登録可能",
];

const PRO_FEATURES = [
  { label: "ベーシックの全機能", strong: true },
  { label: "充電履歴の無制限保存", strong: false },
  { label: "バッテリーヘルスモニター", strong: false },
  { label: "ファントムドレイン分析", strong: false },
  { label: "優先メールサポート", strong: false },
];

type CellValue = "check" | "partial" | "none";

interface ComparisonRow {
  feature: string;
  basic: CellValue | string;
  pro: CellValue;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "ダッシュボードアクセス", basic: "check", pro: "check" },
  { feature: "充電コスト追跡", basic: "30日間", pro: "check" },
  { feature: "バッテリーヘルスモニター", basic: "none", pro: "check" },
  { feature: "走行効率分析", basic: "none", pro: "check" },
  { feature: "ファントムドレイン分析", basic: "none", pro: "check" },
  { feature: "CSVデータエクスポート", basic: "none", pro: "check" },
  { feature: "優先サポート", basic: "none", pro: "check" },
];

const FAQ_ITEMS = [
  {
    question: "Teslaアカウントのデータは安全ですか？",
    answer:
      "はい、安全です。公式のTesla APIトークンを使用しており、パスワードを直接保存することはありません。すべてのデータは業界標準のAES-256暗号化により、保存時・通信時ともに暗号化されています。プライバシーとセキュリティを最優先に考えています。",
  },
  {
    question: "いつでもサブスクリプションを解約できますか？",
    answer:
      "はい、アカウント設定からいつでもすぐに解約できます。プロプランの機能は、現在の請求期間の終了まで引き続きご利用いただけます。",
  },
  {
    question: "EV Mateの使用でバッテリーは消耗しますか？",
    answer:
      "ファントムドレインを最小限に抑えるため、ポーリング頻度を最適化しています。デフォルトでは、車がアイドル状態のときはスリープを維持し、予想される操作や充電セッション中のみ起動します。",
  },
  {
    question: "どのような支払い方法に対応していますか？",
    answer:
      "決済にはStripeを使用しており、主要なクレジットカード（Visa、Mastercard、Amex）およびApple Pay / Google Payに対応しています。",
  },
];

// ── sub-components (inline, no separate files) ───────────────────────────────

function TableCell({ value }: { value: CellValue | string }) {
  if (value === "check") {
    return (
      <td className="p-4 text-center">
        <Check
          className="w-5 h-5 inline-block"
          style={{ color: "var(--color-primary)" }}
        />
      </td>
    );
  }
  if (value === "none") {
    return (
      <td className="p-4 text-center">
        <Minus
          className="w-5 h-5 inline-block"
          style={{ color: "var(--color-border-d2)" }}
        />
      </td>
    );
  }
  // partial / text
  return (
    <td className="p-4 text-center">
      <span className="text-xs" style={{ color: "var(--color-txt-mut)" }}>
        {value as string}
      </span>
    </td>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);

  const monthlyPrice = 980;
  const yearlyPrice = Math.round((monthlyPrice * 12 * 0.8) / 12);

  const displayPrice = yearly ? yearlyPrice : monthlyPrice;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg)", color: "var(--color-txt)" }}
    >
      {/* ── Sticky Header ── */}
      <header
        className="glass-header sticky top-0 z-50 w-full border-b"
        style={{ borderColor: "var(--color-border-d)" }}
      >
        <div className="mx-auto max-w-[1200px] px-4 md:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Zap
              className="w-6 h-6"
              style={{ color: "var(--color-primary)" }}
              aria-hidden="true"
            />
            <span
              className="text-lg font-bold leading-tight tracking-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              EV Mate Japan
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-sm font-medium transition-colors"
                  style={{ color: "var(--color-txt-sec)" }}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 ml-4">
              <Link
                href="/api/auth/tesla"
                className="flex items-center justify-center rounded-lg h-10 px-4 text-sm font-bold transition-colors"
                style={{
                  background: "var(--color-surface)",
                  color: "var(--color-txt)",
                }}
              >
                ログイン
              </Link>
              <Link
                href="/api/auth/tesla"
                className="flex items-center justify-center rounded-lg h-10 px-4 text-sm font-bold transition-colors text-white"
                style={{ background: "var(--color-primary)" }}
              >
                始める
              </Link>
            </div>
          </div>

          {/* Mobile – just login */}
          <Link
            href="/api/auth/tesla"
            className="lg:hidden flex items-center justify-center rounded-lg h-9 px-4 text-sm font-bold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            ログイン
          </Link>
        </div>
      </header>

      <main className="flex-grow">
        {/* ── Hero ── */}
        <section className="px-4 py-12 md:py-20 flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl flex flex-col gap-6">
            <h1
              className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              あなたのEVに最適なプランを選ぶ
            </h1>
            <p
              className="text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
              style={{ color: "var(--color-txt-sec)" }}
            >
              高度な分析、リアルタイムバッテリーヘルス、コスト追跡で、Tesla所有体験を最大限に活用。
            </p>

            {/* Monthly / Yearly toggle */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span
                className="font-medium"
                style={{
                  color: yearly ? "var(--color-txt-sec)" : "var(--color-txt)",
                }}
              >
                月額
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={yearly}
                  onChange={() => setYearly((v) => !v)}
                />
                <div
                  className="w-14 h-7 rounded-full relative transition-colors"
                  style={{
                    background: yearly
                      ? "var(--color-primary)"
                      : "var(--color-surface)",
                  }}
                >
                  <div
                    className="absolute top-0.5 left-[4px] bg-white rounded-full h-6 w-6 transition-transform"
                    style={{
                      transform: yearly
                        ? "translateX(28px)"
                        : "translateX(0px)",
                    }}
                  />
                </div>
              </label>
              <span
                className="font-bold"
                style={{
                  color: yearly ? "var(--color-txt)" : "var(--color-txt-sec)",
                }}
              >
                年額{" "}
                <span
                  className="text-sm font-normal ml-1"
                  style={{ color: "var(--color-primary)" }}
                >
                  （20%お得）
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* ── Pricing Cards ── */}
        <section className="px-4 pb-12">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Basic */}
            <div
              className="flex flex-col rounded-xl border p-8 shadow-sm transition-shadow"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border-d)",
              }}
            >
              <div className="mb-6">
                <h3 className="text-white text-xl font-bold">ベーシック</h3>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--color-txt-sec)" }}
                >
                  ライトユーザー向けの基本機能
                </p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-white text-5xl font-black tracking-tight">
                  ¥0
                </span>
                <span style={{ color: "var(--color-txt-sec)" }}>
                  /月
                </span>
              </div>

              <Link
                href="/api/auth/tesla"
                className="w-full rounded-lg py-3 text-sm font-bold text-center transition-colors mb-8 text-white"
                style={{ background: "var(--color-border-d)" }}
              >
                無料で始める
              </Link>

              <ul className="flex flex-col gap-4 flex-1">
                {BASIC_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3"
                    style={{ color: "var(--color-txt-sec)" }}
                  >
                    <CheckCircle
                      className="w-5 h-5 shrink-0"
                      style={{ color: "var(--color-primary)" }}
                    />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div
              className="relative flex flex-col rounded-xl border-2 p-8 shadow-lg"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-primary)",
                boxShadow: "0 20px 60px rgba(19,164,236,0.12)",
              }}
            >
              {/* Badge */}
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                style={{ background: "var(--color-primary)" }}
              >
                人気No.1
              </div>

              <div className="mb-6">
                <h3 className="text-white text-xl font-bold">プロ</h3>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--color-txt-sec)" }}
                >
                  パワーユーザー向けの完全な分析機能
                </p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-white text-5xl font-black tracking-tight">
                  ¥{displayPrice.toLocaleString()}
                </span>
                <span style={{ color: "var(--color-txt-sec)" }}>
                  /月
                </span>
                {yearly && (
                  <span
                    className="ml-2 text-xs"
                    style={{ color: "var(--color-txt-mut)" }}
                  >
                    年一括払い
                  </span>
                )}
              </div>

              <Link
                href="/api/auth/tesla"
                className="w-full rounded-lg py-3 text-sm font-bold text-center transition-colors mb-8 text-white shadow-lg"
                style={{
                  background: "var(--color-primary)",
                  boxShadow: "0 8px 25px rgba(19,164,236,0.25)",
                }}
              >
                プロにアップグレード
              </Link>

              <ul className="flex flex-col gap-4 flex-1">
                {PRO_FEATURES.map(({ label, strong }) => (
                  <li
                    key={label}
                    className="flex items-center gap-3"
                    style={{
                      color: strong ? "var(--color-txt)" : "var(--color-txt-sec)",
                    }}
                  >
                    <CheckCircle
                      className="w-5 h-5 shrink-0"
                      style={{ color: "var(--color-primary)" }}
                    />
                    <span className={`text-sm ${strong ? "font-semibold" : ""}`}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Feature Comparison Table ── */}
        <section
          className="px-4 py-12"
          style={{ background: "var(--color-bg-alt)" }}
        >
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-bold text-center text-white mb-10"
              style={{ fontFamily: "var(--font-display)" }}
            >
              機能比較
            </h2>

            <div
              className="overflow-hidden rounded-xl border shadow-sm"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border-d)",
              }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      background: "var(--color-surface-hi)",
                      borderColor: "var(--color-border-d)",
                    }}
                  >
                    <th
                      className="p-4 md:p-6 text-sm font-bold text-white w-1/2"
                    >
                      機能
                    </th>
                    <th className="p-4 md:p-6 text-sm font-bold text-center text-white w-1/4">
                      ベーシック
                    </th>
                    <th
                      className="p-4 md:p-6 text-sm font-bold text-center w-1/4"
                      style={{ color: "var(--color-primary)" }}
                    >
                      プロ
                    </th>
                  </tr>
                </thead>
                <tbody
                  style={{
                    borderColor: "var(--color-border-d)",
                  }}
                >
                  {COMPARISON_ROWS.map(({ feature, basic, pro }, index) => (
                    <tr
                      key={feature}
                      className="border-t"
                      style={{ borderColor: "var(--color-border-d)" }}
                    >
                      <td
                        className="p-4 md:px-6 text-sm"
                        style={{
                          color:
                            index % 2 === 0
                              ? "var(--color-txt)"
                              : "var(--color-txt-sec)",
                        }}
                      >
                        {feature}
                      </td>
                      <TableCell value={basic} />
                      <TableCell value={pro} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-4 py-16 md:py-24" style={{ background: "var(--color-bg)" }}>
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-bold text-center text-white mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              よくある質問
            </h2>
            <p
              className="text-center mb-12"
              style={{ color: "var(--color-txt-sec)" }}
            >
              EV Mate Japanとデータプライバシーについて。
            </p>

            <div className="flex flex-col gap-4">
              {FAQ_ITEMS.map(({ question, answer }) => (
                <div
                  key={question}
                  className="rounded-lg border overflow-hidden"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border-d)",
                  }}
                >
                  <details className="group p-6 cursor-pointer">
                    <summary className="flex justify-between items-center font-medium text-white list-none select-none">
                      <span>{question}</span>
                      <ChevronDown
                        className="w-5 h-5 transition-transform group-open:rotate-180 shrink-0 ml-4"
                        style={{ color: "var(--color-txt-sec)" }}
                      />
                    </summary>
                    <div
                      className="mt-4 leading-relaxed text-sm"
                      style={{ color: "var(--color-txt-sec)" }}
                    >
                      {answer}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section
          className="py-16 border-t"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border-d)",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              EVライフを最適化する準備はできましたか？
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/api/auth/tesla"
                className="w-full sm:w-auto px-8 py-3 rounded-lg text-white font-bold transition-all shadow-lg text-center"
                style={{
                  background: "var(--color-primary)",
                  boxShadow: "0 8px 25px rgba(19,164,236,0.2)",
                }}
              >
                14日間無料トライアル
              </Link>
              <button
                className="w-full sm:w-auto px-8 py-3 rounded-lg border font-bold transition-all text-white"
                style={{ borderColor: "var(--color-border-d)" }}
              >
                お問い合わせ
              </button>
            </div>
            <p
              className="mt-4 text-xs"
              style={{ color: "var(--color-txt-mut)" }}
            >
              ベーシックプランはクレジットカード不要。
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="border-t py-12 px-10"
        style={{
          background: "var(--color-bg)",
          borderColor: "var(--color-border-d)",
        }}
      >
        <div className="max-w-[960px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Zap
              className="w-5 h-5"
              style={{ color: "var(--color-primary)" }}
              aria-hidden="true"
            />
            <p className="text-sm" style={{ color: "var(--color-txt-sec)" }}>
              &copy; 2026 EV Mate Japan. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            {["プライバシーポリシー", "利用規約", "Twitter"].map((label) => (
              <a
                key={label}
                href="#"
                className="text-sm transition-colors"
                style={{ color: "var(--color-txt-sec)" }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
