"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, ShieldCheck, Clock } from "lucide-react"
import { version } from "../../../package.json"

export default function AboutPage() {
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID || "Development-Build"
    const buildDate = new Date().toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4">
            <Card className="max-w-md w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Info size={32} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight">
                        Über Finance Analyzer
                    </CardTitle>
                    <p className="text-zinc-500 text-sm">Präzise Finanzanalyse mit KI-Fokus.</p>
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    {/* Build Info Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Version</p>
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">v{version}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Build-Datum</p>
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{buildDate}</p>
                        </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Build-ID</p>
                            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full uppercase">
                                {buildId === "Development-Build" ? "Lokal" : "Produktion"}
                            </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1 break-all">
                            {buildId}
                        </p>
                    </div>

                    {/* Security Note */}
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck size={16} />
                            <span className="text-xs font-black uppercase tracking-wider">Sicherheitsfokus</span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Alle Analysen erfolgen verschlüsselt im RAM. Daten werden nach dem Schließen der Session gelöscht. Keine dauerhafte Speicherung Ihrer Finanzdaten.
                        </p>
                    </div>

                    {/* Build Command Note (Comment only for devs) */}
                    {/* 
                        Deploy-Hinweis:
                        Railway Build Command: export NEXT_PUBLIC_BUILD_ID=$(date +'%Y%m%d.%H%M') && npm run build
                    */}

                </CardContent>
            </Card>
        </div>
    )
}
