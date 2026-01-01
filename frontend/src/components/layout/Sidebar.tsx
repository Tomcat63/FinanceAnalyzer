"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Info, Receipt, PieChart, ShoppingCart, Settings, User, Wallet } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex flex-col z-10 overflow-y-auto max-h-screen">
            <div className="p-6">
                <Link href="/">
                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Wallet size={24} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            FinanceAnalyzer
                        </h1>
                    </div>
                </Link>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                <Link href="/">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={pathname === "/"}
                    />
                </Link>
                {/* 
          Temporarily commented out non-functional items to clean up UI 
          as requested. 
        */}
                {/* 
        <NavItem icon={<Receipt size={20} />} label="Transaktionen" />
        <NavItem icon={<PieChart size={20} />} label="Analyse" />
        <NavItem icon={<ShoppingCart size={20} />} label="Abos" /> 
        */}
            </nav>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                {/* 
        <NavItem icon={<Settings size={20} />} label="Einstellungen" />
        <NavItem icon={<User size={20} />} label="Profil" /> 
        */}
                <Link href="/about">
                    <NavItem
                        label="Über Finance Analyzer"
                        active={pathname === "/about"}
                    />
                </Link>
            </div>
        </aside>
    );
}

function NavItem({ icon, label, active = false }: { icon?: React.ReactNode; label: string; active?: boolean }) {
    return (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${active
            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
            : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}>
            {icon}
            <span>{label}</span>
        </div>
    );
}
