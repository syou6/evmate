"use client";

import Link from "next/link";
import {
  Zap,
  ArrowRight,
  PlayCircle,
  BatteryCharging,
  Gauge,
  CircleDollarSign,
  Map,
  CheckCircle,
  TrendingDown,
  Check,
} from "lucide-react";

const FEATURES = [
  {
    icon: BatteryCharging,
    title: "バッテリーヘルス",
    desc: "天候条件に基づいた詳細なバッテリー分析で、劣化状況を監視し、航続距離を最大化します。",
    color: "bg-blue-500/15 text-primary",
  },
  {
    icon: Gauge,
    title: "走行効率",
    desc: "高速道路と一般道でのWh/km消費量を分析し、航続距離を改善します。",
    color: "bg-green-500/15 text-green-400",
  },
  {
    icon: CircleDollarSign,
    title: "充電コスト",
    desc: "スーパーチャージャー、CHAdeMO、自宅充電のコストを追跡。ガソリン車との節約額を計算します。",
    color: "bg-yellow-500/15 text-yellow-400",
  },
  {
    icon: Map,
    title: "トリップ分析",
    desc: "日本各地のドライブを可視化し、地形ごとのエネルギー消費パターンを把握します。",
    color: "bg-purple-500/15 text-purple-400",
  },
];

const BASIC_FEATURES = [
  "基本バッテリーヘルスチェック",
  "直近30日間の履歴",
  "1台まで登録可能",
];

const PRO_FEATURES = [
  { label: "ベーシックの全機能", bold: true },
  { label: "無制限の履歴とデータエクスポート", bold: false },
  { label: "リアルタイム充電コスト計算", bold: false },
  { label: "複数車両サポート", bold: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-txt">
      {/* ── Header ── */}
      <header className="glass-header sticky top-0 z-50 w-full border-b border-border-d">
        <div className="mx-auto max-w-[1200px] px-4 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold tracking-tight font-display">
              EV Mate Japan
            </span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              {[
                { label: "機能", href: "#features" },
                { label: "料金", href: "#pricing" },
                { label: "概要", href: "#about" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="text-sm font-medium text-txt-sec hover:text-primary transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>
            <Link
              href="/api/auth/tesla"
              className="flex items-center justify-center rounded-lg h-9 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-colors shadow-lg shadow-primary/20"
            >
              ログイン
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="w-full bg-bg pt-8 pb-16">
          <div className="mx-auto max-w-[1200px] px-4 md:px-10">
            <div className="relative overflow-hidden rounded-2xl border border-border-d min-h-[560px] flex flex-col justify-end p-8 md:p-12 lg:p-16">
              {/* BG gradient */}
              <div
                className="absolute inset-0 z-0"
                style={{
                  background:
                    "linear-gradient(135deg, #0e2a38 0%, #0d1c26 40%, #091520 100%)",
                }}
              />
              {/* Glow orbs */}
              <div
                className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
                style={{
                  background:
                    "radial-gradient(circle, rgba(19,164,236,0.15) 0%, transparent 70%)",
                }}
              />
              <div
                className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full pointer-events-none z-0"
                style={{
                  background:
                    "radial-gradient(circle, rgba(19,164,236,0.08) 0%, transparent 70%)",
                }}
              />
              {/* Bottom fade */}
              <div
                className="absolute inset-0 z-[1]"
                style={{
                  background:
                    "linear-gradient(to top, #101c22 0%, rgba(16,28,34,0.75) 50%, transparent 100%)",
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col gap-6 max-w-2xl animate-in">
                <div className="flex flex-col gap-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 w-fit backdrop-blur-sm">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-primary text-xs font-bold uppercase tracking-wider">
                      日本で利用可能
                    </span>
                  </span>

                  <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white font-display delay-1 animate-in">
                    日本のEVライフを
                    <br />
                    もっとスマートに。
                  </h1>

                  <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed max-w-lg delay-2 animate-in">
                    バッテリーヘルス、走行効率、充電コストを簡単に管理。あなたのEVライフを最適化します。
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 delay-3 animate-in">
                  <Link
                    href="/api/auth/tesla"
                    className="flex items-center gap-2 h-12 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition-all shadow-lg shadow-primary/25 hover:scale-105"
                  >
                    <span>無料で始める</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button className="flex items-center gap-2 h-12 px-6 rounded-lg bg-surface/50 border border-white/20 text-white font-medium backdrop-blur-md transition-all hover:border-white/40">
                    <PlayCircle className="w-5 h-5" />
                    <span>デモを見る</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-16 bg-bg">
          <div className="mx-auto max-w-[1200px] px-4 md:px-10">
            <div className="flex flex-col gap-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-display">
                EVを完全に管理するための全機能
              </h2>
              <p className="text-txt-sec text-lg max-w-2xl">
                日本の道路・充電インフラに特化した総合分析ツール。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="flex flex-col gap-4 rounded-xl border border-border-d bg-surface p-6 hover:border-primary/50 transition-colors"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {title}
                    </h3>
                    <p className="text-txt-sec text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Data Viz Preview ── */}
        <section className="py-16 bg-surface border-y border-border-d">
          <div className="mx-auto max-w-[1200px] px-4 md:px-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-display">
                あなたの影響を可視化。
                <br />
                <span className="text-primary">リアルタイムで。</span>
              </h2>
              <p className="text-txt-sec text-lg">
                TeslaのAPIに直接接続。追加ハードウェア不要でリアルタイムデータを取得。
              </p>
              <ul className="space-y-4">
                {[
                  "バッテリー温度のリアルタイム監視",
                  "ファントムドレイン分析",
                  "充電セッションのエクスポート（CSV/PDF）",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 text-primary" />
                    <span className="text-txt">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 w-full">
              <div className="relative rounded-xl overflow-hidden shadow-2xl bg-bg border border-border-d aspect-video">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(19,164,236,0.08) 0%, transparent 60%)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="w-full max-w-xs rounded-xl border border-border-d p-6 shadow-2xl backdrop-blur-sm bg-bg/92">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <div className="text-xs text-txt-mut uppercase tracking-wider mb-1">
                          効率
                        </div>
                        <div className="text-2xl font-bold text-white">
                          142 Wh/km
                        </div>
                      </div>
                      <div className="text-green-400 flex items-center text-sm font-medium">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        -2.4% vs avg
                      </div>
                    </div>
                    <div className="h-2 w-full bg-border-d rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-[70%]" />
                    </div>
                    <div className="flex justify-between text-xs text-txt-mut mt-2">
                      <span>Tokyo</span>
                      <span>Osaka</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-5">
                      {[
                        { label: "航続距離", value: "380km" },
                        { label: "セッション", value: "12" },
                        { label: "節約額", value: "¥4,200" },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="rounded-lg p-2 text-center bg-surface"
                        >
                          <div className="text-xs font-bold text-white">
                            {value}
                          </div>
                          <div className="text-[10px] mt-0.5 text-txt-mut">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-20 bg-bg">
          <div className="mx-auto max-w-[1200px] px-4 md:px-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">
                シンプルで透明な料金体系
              </h2>
              <p className="text-txt-sec">
                あなたの走行スタイルに合ったプランを選択。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic */}
              <div className="flex flex-col p-8 bg-surface rounded-2xl border border-border-d hover:border-primary/30 transition-all">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">ベーシック</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-white">無料</span>
                    <span className="ml-1 text-txt-mut">/永久</span>
                  </div>
                  <p className="mt-4 text-sm text-txt-sec">
                    ライトユーザー向けの基本機能
                  </p>
                </div>
                <div className="flex-1 my-8">
                  <ul className="space-y-4">
                    {BASIC_FEATURES.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-sm text-txt"
                      >
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/api/auth/tesla"
                  className="block w-full py-3 px-4 rounded-lg border border-border-d2 text-center text-white font-bold hover:bg-surface-hi transition-colors"
                >
                  無料で始める
                </Link>
              </div>

              {/* Pro */}
              <div className="relative flex flex-col p-8 bg-surface rounded-2xl border-2 border-primary shadow-xl shadow-primary/10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  人気No.1
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">プロメイト</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-white">¥500</span>
                    <span className="ml-1 text-txt-mut">/月</span>
                  </div>
                  <p className="mt-4 text-sm text-txt-sec">
                    本格EVオーナー向けの高度な分析
                  </p>
                </div>
                <div className="flex-1 my-8">
                  <ul className="space-y-4">
                    {PRO_FEATURES.map(({ label, bold }) => (
                      <li
                        key={label}
                        className="flex items-center gap-3 text-sm text-txt"
                      >
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {bold ? <strong>{label}</strong> : label}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/pricing"
                  className="block w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary-dark text-center text-white font-bold transition-colors shadow-md"
                >
                  プロプランを見る
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section
          id="about"
          className="py-20 bg-surface border-t border-border-d relative overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(19,164,236,0.18) 0%, transparent 60%)",
            }}
          />
          <div className="mx-auto max-w-[960px] px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display">
              あなたのEVライフを最適化しませんか？
            </h2>
            <p className="text-txt-sec text-lg mb-10 max-w-2xl mx-auto">
              日本中のEVオーナーが、バッテリーヘルスと充電コストの最適化を始めています。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/api/auth/tesla"
                className="w-full sm:w-auto h-14 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white text-lg font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
              >
                無料アカウント作成
              </Link>
              <span className="text-txt-mut text-sm">
                無料プランはクレジットカード不要
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-bg border-t border-border-d py-12">
        <div className="mx-auto max-w-[1200px] px-4 md:px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-white">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg">EV Mate Japan</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-txt-sec">
              {[
                "プライバシーポリシー",
                "利用規約",
                "サポート",
                "Twitter",
              ].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="hover:text-primary transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="text-txt-mut text-sm">
              &copy; 2026 EV Mate Japan. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
