"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Info, Receipt, PieChart, ShoppingCart, Settings, User, Wallet } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const navigate = (path: string) => {
        router.push(path);
    };

    return (
        <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex flex-col z-10 min-h-0 h-screen shrink-0">
            <div className="p-6 shrink-0">
                <div
                    onClick={() => navigate("/")}
                    className="flex items-center gap-3 cursor-pointer group"
                >
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Wallet size={24} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        FinanceAnalyzer
                    </h1>
                </div>
            </div>
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto min-h-0">
                <NavItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    active={pathname === "/"}
                    onClick={() => navigate("/")}
                />
                <NavItem
                    icon={<PieChart size={20} />}
                    label="Analyse"
                    active={pathname === "/analyse"}
                    onClick={() => navigate("/analyse")}
                />
            </nav>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1 shrink-0">
                <NavItem
                    label="Über Finance Analyzer"
                    active={pathname === "/about"}
                    onClick={() => navigate("/about")}
                />
            </div>
        </aside>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon?: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${active
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
        >
            {icon}
            <span>{label}</span>
        </div>
    );
}

