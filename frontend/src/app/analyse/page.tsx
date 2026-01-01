"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Home,
    Shield,
    Tv,
    Zap,
    CreditCard,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    PieChart,
    HelpCircle,
    Info
} from "lucide-react";
import {
    DonutChart,
    ProgressBar,
    BadgeDelta,
    Flex,
    Text,
    Metric,
    CategoryBar,
    Legend
} from "@tremor/react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTransactions } from "@/context/TransactionContext";

interface MetricValue {
    amount: number;
    percentage: number;
    target: number;
}

interface FinancialMetrics {
    income: number;
    needs: MetricValue;
    wants: MetricValue;
    savings: MetricValue;
    error?: string;
}

interface CategoryBreakdown {
    name: string;
    amount: number;
    count: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    "Wohnen": <Home size={18} />,
    "Versicherungen": <Shield size={18} />,
    "Medien": <Tv size={18} />,
    "Nebenkosten": <Zap size={18} />,
    "Finanzierung": <CreditCard size={18} />,
    "Sonstiges": <PieChart size={18} />
};

const CATEGORY_COLORS: Record<string, string> = {
    "Wohnen": "blue",
    "Versicherungen": "indigo",
    "Medien": "violet",
    "Nebenkosten": "amber",
    "Finanzierung": "rose",
    "Sonstiges": "zinc"
};

// API Base URL (sync with main page.tsx)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://financeanalyzer-production.up.railway.app'
    : 'http://127.0.0.1:8000');

export default function AnalysePage() {
    const { status } = useTransactions();
    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
    const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'READY') {
            fetchMetrics();
        }
    }, [status]);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/financial-health`);
            if (!response.ok) {
                throw new Error("Bitte laden Sie zuerst Ihre Transaktionsdaten hoch.");
            }
            const data = await response.json();
            setMetrics(data.metrics);
            setBreakdown(data.breakdown);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (status !== 'READY') return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || metrics?.error) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
                <Card className="bg-red-500/10 border-red-500/20 p-8 text-center rounded-3xl backdrop-blur-xl">
                    <div className="flex justify-center mb-4">
                        <AlertCircle size={48} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Analyse nicht möglich</h2>
                    <p className="text-zinc-500 mb-6">{error || metrics?.error}</p>
                </Card>
            </div>
        );
    }


    // Calculate Fixed Cost Health Color
    const fixedPerc = metrics?.needs.percentage || 0;
    const getHealthColor = (perc: number) => {
        if (perc <= 50) return "emerald";
        if (perc <= 65) return "amber";
        return "rose";
    };
    const healthColor = getHealthColor(fixedPerc);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Fixkosten-Analyse
                </h1>
                <p className="text-zinc-500 font-medium">
                    Detaillierte Analyse Ihrer Fixkosten und finanziellen Gesundheit basierend auf der 50-30-20 Regel.
                </p>
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl max-w-2xl">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Die **50-30-20 Regel** ist eine einfache Methode zur Budgetplanung: **50%** für Notwendigkeiten (Fixkosten), **30%** für persönliche Bedürfnisse (Wünsche) und **20%** für Ersparnisse oder den Schuldenabbau.
                    </p>
                </div>
            </header>

            <TooltipProvider>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Health Card */}
                    <Card className="lg:col-span-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden group">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">
                                    Fixkosten Health-Check
                                </CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="p-2 cursor-help text-zinc-400 hover:text-blue-500 transition-colors">
                                            <HelpCircle size={18} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-900 border-zinc-800 text-white p-4 rounded-xl max-w-xs shadow-2xl">
                                        <p className="text-xs font-medium leading-relaxed">
                                            Der Health-Check bewertet den Anteil Ihrer Fixkosten am Gesamteinkommen. Ein Wert unter 50% gilt als ideal für finanzielle Freiheit.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="flex flex-col items-center">
                                <Metric className="font-black text-6xl tracking-tighter mb-2">
                                    {fixedPerc}%
                                </Metric>
                                <div className="flex items-center gap-2">
                                    <BadgeDelta deltaType={fixedPerc <= 50 ? "increase" : "moderateDecrease"} size="xs" isIncreasePositive={false}>
                                        {fixedPerc <= 50 ? "Optimal" : fixedPerc <= 65 ? "Grenzbereich" : "Kritisch"}
                                    </BadgeDelta>
                                    <Text className="text-zinc-500">Ihrer Einnahmen fließen in Fixkosten</Text>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Flex>
                                    <Text className="font-bold">Status</Text>
                                    <Text className="font-bold">{fixedPerc}% / 50% Target</Text>
                                </Flex>
                                <CategoryBar
                                    values={[50, 15, 35]}
                                    colors={["emerald", "amber", "rose"]}
                                    markerValue={fixedPerc}
                                    className="mt-3"
                                />
                            </div>

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-start gap-4">
                                {fixedPerc <= 50 ? (
                                    <CheckCircle2 className="text-emerald-500 mt-1 shrink-0" />
                                ) : (
                                    <AlertCircle className="text-amber-500 mt-1 shrink-0" />
                                )}
                                <div>
                                    <h4 className="font-bold text-sm">Empfehlung</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                                        {fixedPerc <= 50
                                            ? "Ihre Fixkosten sind perfekt optimiert. Sie haben viel Spielraum für Investitionen und Lebensqualität."
                                            : "Ihre Fixkosten liegen über dem empfohlenen Limit. Prüfen Sie Abonnements und Versicherungen auf Sparpotenzial."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 50-30-20 Strategy Check */}
                    <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">
                                    50-30-20 Strategie
                                </CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-help text-zinc-400">
                                            <HelpCircle size={14} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-900 border-zinc-800 text-white p-4 rounded-xl max-w-xs shadow-2xl">
                                        <div className="space-y-2">
                                            <p className="font-bold text-xs border-b border-zinc-700 pb-1">Die 50-30-20 Regel:</p>
                                            <p className="text-[10px] leading-relaxed">
                                                <span className="font-bold text-emerald-400">50% Needs:</span> Lebensnotwendige Fixkosten (Miete, Strom, etc.)<br />
                                                <span className="font-bold text-blue-400">30% Wants:</span> Deine Wünsche & Lebensqualität (Hobbys, Reisen)<br />
                                                <span className="font-bold text-purple-400">20% Savings:</span> Sparen, Schuldenabbau & Investitionen
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <DonutChart
                                className="h-44"
                                data={[
                                    { name: "Needs (Fix)", amount: metrics?.needs.amount || 0 },
                                    { name: "Wants (Variabel)", amount: metrics?.wants.amount || 0 },
                                    { name: "Savings (Sparquote)", amount: metrics?.savings.amount || 0 }
                                ]}
                                category="amount"
                                index="name"
                                colors={["emerald", "blue", "violet"]}
                                showAnimation={true}
                                variant="donut"
                            />
                            <Legend
                                categories={["Needs (50%)", "Wants (30%)", "Savings (20%)"]}
                                colors={["emerald", "blue", "violet"]}
                                className="justify-center"
                            />

                            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                                <div className="flex justify-between items-center">
                                    <Text className="text-xs font-bold">Sparpotential</Text>
                                    <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                        +{metrics?.savings.amount.toLocaleString()} € / Monat
                                    </Text>
                                </div>
                                <ProgressBar value={metrics?.savings.percentage || 0} color="violet" className="mt-1" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Category Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {breakdown.map((cat, idx) => (
                        <Card key={idx} className="bg-white/40 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-xl bg-${CATEGORY_COLORS[cat.name] || 'zinc'}-500/10 text-${CATEGORY_COLORS[cat.name] || 'zinc'}-600 dark:text-${CATEGORY_COLORS[cat.name] || 'zinc'}-400`}>
                                        {CATEGORY_ICONS[cat.name] || <PieChart size={18} />}
                                    </div>
                                    <BadgeDelta deltaType="unchanged" size="xs">
                                        {cat.count} Posten
                                    </BadgeDelta>
                                </div>
                                <div className="space-y-1">
                                    <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{cat.name}</Text>
                                    <Metric className="text-2xl font-black">{cat.amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</Metric>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TooltipProvider>

            {/* Security Note Footer */}
            <footer className="pt-8 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-800">
                    <Info size={14} className="text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Alle Berechnungen erfolgen lokal in Ihrem Browser & RAM
                    </span>
                </div>
            </footer>
        </div>
    );
}
