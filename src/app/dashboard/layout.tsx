"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Battery,
  Car,
  Zap,
  Settings,
  LogOut,
} from "lucide-react";
import { useTeslaData } from "@/hooks/useTeslaData";

const NAV_ITEMS = [
  { href: "/dashboard", label: "概要", icon: Home },
  { href: "/dashboard/battery", label: "バッテリー", icon: Battery },
  { href: "/dashboard/driving", label: "走行", icon: Car },
  { href: "/dashboard/charging", label: "充電", icon: Zap },
  { href: "/dashboard/settings", label: "設定", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { state } = useTeslaData();

  const modelName =
    state.status === "success"
      ? `Tesla ${state.data.vehicleData.display_name || "Model"}`
      : null;

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border-d bg-bg">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex flex-col gap-6">
            {/* Profile */}
            <div className="flex items-center gap-3 px-2">
              <div className="size-10 rounded-full bg-surface flex items-center justify-center text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-bold leading-tight truncate">
                  EV Mate Japan
                </h1>
                <p className="text-xs text-txt-mut truncate">
                  {modelName || "読み込み中..."}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-txt-mut hover:bg-surface hover:text-txt"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-d p-2.5 text-sm font-medium text-txt-mut hover:bg-surface transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between border-b border-border-d bg-bg px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold">EV Mate</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-txt-mut"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-b border-border-d bg-bg overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-txt-mut"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-bg p-6 md:p-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
