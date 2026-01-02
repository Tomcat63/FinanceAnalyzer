import { useMemo, useState, useEffect } from "react";
import { useTransactions } from "@/context/TransactionContext";

export interface AdvisoryTip {
    id: string;
    category: string;
    type: "positive" | "negative" | "neutral";
    title: string;
    description: string;
    confidence: number;
    selected: boolean;
}

const BENCHMARKS: Record<string, number> = {
    "Wohnen": 0.30,
    "Versicherungen": 0.10,
    "Freizeit": 0.30,
};

// Map categories to professional titles
const CATEGORY_NAMES: Record<string, string> = {
    "Wohnen": "Wohnkosten & Miete",
    "Versicherungen": "Vorsorge & Versicherungen",
    "Freizeit": "Lebensstil & Freizeit",
};

export function useAdvisory() {
    const { transactions, status } = useTransactions();
    const [tips, setTips] = useState<AdvisoryTip[]>([]);
    const [loading, setLoading] = useState(false);

    const calculateBenchmarks = useMemo(() => {
        if (status !== 'READY' || !transactions.length) return null;

        const totalIncome = transactions
            .filter(t => t.Betrag > 0)
            .reduce((sum, t) => sum + t.Betrag, 0);

        const categoryTotals: Record<string, number> = {};
        transactions.forEach(t => {
            if (t.Betrag < 0) {
                const absBetrag = Math.abs(t.Betrag);
                categoryTotals[t.Kategorie] = (categoryTotals[t.Kategorie] || 0) + absBetrag;
            }
        });

        const results = Object.keys(BENCHMARKS).map(cat => {
            const spent = categoryTotals[cat] || 0;
            const share = totalIncome > 0 ? spent / totalIncome : 0;
            const target = BENCHMARKS[cat];
            const deviation = share - target;

            return {
                category: cat,
                spent,
                share,
                target,
                deviation
            };
        });

        return { totalIncome, results };
    }, [transactions, status]);

    const generateDynamicInsights = async () => {
        if (!calculateBenchmarks) return;

        setLoading(true);
        try {
            const prompts = calculateBenchmarks.results
                .filter(res => Math.abs(res.deviation) > 0.05) // Significant deviation
                .map(res => {
                    const state = res.deviation > 0 ? "zu hoch" : "sehr effizient";
                    return `Kategorie: ${res.category}, Aktueller Anteil: ${(res.share * 100).toFixed(1)}%, Ziel-Benchmark: ${(res.target * 100).toFixed(1)}%. Zustand ist ${state}.`;
                });

            if (prompts.length === 0) {
                setTips([{
                    id: "optimal",
                    category: "General",
                    type: "positive",
                    title: "Optimale Budgetverteilung",
                    description: "Ihre Fixkosten liegen in allen Kernbereichen innerhalb der empfohlenen Benchmarks. Kompliment für Ihr exzellentes Finanzmanagement!",
                    confidence: 0.95,
                    selected: true
                }]);
                return;
            }

            // Call AI Backend (simulated for now, would be a real fetch to /api/ai/advice)
            // Using existing API_BASE_URL logic if needed
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/ai/advisory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    benchmarks: calculateBenchmarks.results,
                    total_income: calculateBenchmarks.totalIncome
                })
            });

            if (!response.ok) throw new Error("AI Advisor failed");

            const data = await response.json();
            // data.tips: { category: string, title: string, text: string, confidence: number, score: number }[]

            const newTips: AdvisoryTip[] = data.tips
                .filter((t: any) => t.confidence > 0.6)
                .map((t: any, idx: number) => ({
                    id: `tip-${idx}`,
                    category: t.category,
                    type: t.score > 0 ? "positive" : t.score < 0 ? "negative" : "neutral",
                    title: t.title,
                    description: t.text,
                    confidence: t.confidence,
                    selected: true
                }));

            setTips(newTips);
        } catch (err) {
            console.error("Advisory Error:", err);
            // Fallback tips
            setTips([{
                id: "fallback",
                category: "System",
                type: "neutral",
                title: "Hinweis zur Analyse",
                description: "KI-Insights konnten nicht geladen werden. Bitte prüfen Sie Ihre Verbindung zum Backend.",
                confidence: 0.5,
                selected: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (calculateBenchmarks && tips.length === 0) {
            generateDynamicInsights();
        }
    }, [calculateBenchmarks]);

    return { tips, setTips, loading, calculateBenchmarks, refresh: generateDynamicInsights };
}
