"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Info, AlertCircle } from "lucide-react";
import { AreaChart, Text, Metric } from "@tremor/react";
import { useTransactions } from "@/context/TransactionContext";

export default function KontostandPage() {
    const { balanceHistory, accountBalance } = useTransactions();

    if (!balanceHistory || balanceHistory.length === 0) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
                <Card className="bg-blue-500/10 border-blue-500/20 p-8 text-center rounded-3xl backdrop-blur-xl">
                    <div className="flex justify-center mb-4">
                        <AlertCircle size={48} className="text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Keine Daten verfügbar</h2>
                    <p className="text-zinc-500 mb-6">Bitte laden Sie zuerst Ihre Transaktionsdaten im Dashboard hoch.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Kontostand
                </h1>
                <p className="text-zinc-500 font-medium">
                    Visualisierung Ihrer Kontostand-Entwicklung über den gesamten Zeitraum.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {/* Current Balance Summary */}
                <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <Text className="text-zinc-400 font-black uppercase tracking-widest text-xs">Aktueller Kontostand</Text>
                            <Metric className="font-black text-4xl tracking-tighter mt-1">
                                {accountBalance?.value.toLocaleString("de-DE", { style: "currency", currency: "EUR" }) || "0,00 €"}
                            </Metric>
                        </div>
                        <div className="p-4 bg-indigo-500/10 rounded-2xl">
                            <TrendingUp size={32} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </Card>

                {/* Balance History Graph */}
                <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden p-6 h-[500px]">
                    <CardHeader className="px-0 pt-0 pb-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Verlauf</CardTitle>
                    </CardHeader>
                    <AreaChart
                        className="h-[380px] mt-4"
                        data={balanceHistory}
                        index="date"
                        categories={["balance"]}
                        colors={["indigo"]}
                        valueFormatter={(number) => Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(number)}
                        showAnimation={true}
                        showLegend={false}
                        yAxisWidth={80}
                    />
                </Card>
            </div>

            {/* Note Footer */}
            <footer className="pt-8 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-800">
                    <Info size={14} className="text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Zeitraum: {balanceHistory[0].date} bis {balanceHistory[balanceHistory.length - 1].date}
                    </span>
                </div>
            </footer>
        </div>
    );
}
