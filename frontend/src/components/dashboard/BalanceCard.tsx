"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History, Info, Lock, TrendingUp } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface BalanceCardProps {
    balance: number;
    label: string;
    history?: any[];
}

export function BalanceCard({ balance, label }: BalanceCardProps) {
    const formatEuro = (val: number) => {
        return val.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
    };

    return (
        <TooltipProvider>
            <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-2xl relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <History size={160} />
                </div>

                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">
                            {label}
                        </CardTitle>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 cursor-help">
                                    <Lock size={12} className="text-emerald-300" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Lokale Session-Analyse</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-zinc-900 border-zinc-800 text-white p-3 rounded-xl max-w-xs shadow-2xl">
                                <p className="text-xs font-medium leading-relaxed">
                                    Ihre Daten werden ausschließlich im Arbeitsspeicher (RAM) verarbeitet und niemals dauerhaft auf der Festplatte gespeichert.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="mt-2">
                        <div className="text-5xl md:text-6xl font-black tracking-tighter mb-4 drop-shadow-sm">
                            {formatEuro(balance)}
                        </div>

                        <div className="flex items-center gap-4 text-blue-100/80 text-xs font-bold">
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                                <Info size={14} className="text-blue-200" />
                                <span>Flüchtige Datenstruktur (RAM-only)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <TrendingUp size={14} className="text-emerald-300" />
                                <span>Rechtzeit-Verarbeitung</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}
