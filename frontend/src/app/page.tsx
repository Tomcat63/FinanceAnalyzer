"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, AreaChart } from "@tremor/react";
import { ArrowUpRight, ArrowDownRight, RefreshCw, Upload as UploadIcon, Download, Calendar, Search, FilterX, HelpCircle, ChevronUp, ChevronDown, Sparkles, Loader2, Info, Lock, History, TrendingUp } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subDays, startOfDay, endOfDay, isWithinInterval, format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { BalanceCard } from "@/components/dashboard/BalanceCard";

interface Transaction {
  Buchungsdatum: string;
  Zahlungsempfänger: string;
  Verwendungszweck: string;
  Betrag: number;
  Kategorie: string;
  Wiederkehrend: boolean;
  Fixkosten: boolean;
}

type SortConfig = {
  key: keyof Transaction | null;
  direction: "asc" | "desc";
};

type CategorySummary = {
  name: string;
  amount: number;
  count: number;
  share: number;
};

type CategorySortConfig = {
  key: keyof CategorySummary;
  direction: "asc" | "desc";
};

// Explizite Farben für Tremor (Strings aus der Tremor-Palette)
const CHART_COLORS = ["blue", "indigo", "rose", "amber", "emerald", "sky", "violet", "cyan"];

// API Base URL - Prioritize Env Var, then Railway Backend in Production, localhost in Development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://financeanalyzer-production.up.railway.app'
  : 'http://127.0.0.1:8000');

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, CheckSquare, Square, Settings as SettingsIcon } from "lucide-react";
import { useTransactions } from "@/context/TransactionContext";

// ... (Kategorie Definitionen etc.)

const PREDEFINED_PROMPTS = [
  "Analysiere meine Shopping-Sucht bei Amazon",
  "Finde versteckte Abos",
  "Sparpotential bei Fixkosten berechnen",
  "Wöchentlicher Ausgaben-Trend",
  "Vergleich zum Vormonat",
  "Händler mit den meisten Buchungen",
  "Steuerlich relevante Posten markieren",
  "Größte Einzelbuchungen finden",
  "Gastronomie-Ausgaben summieren",
  "Anomalie-Erkennung"
];

export default function DashboardPage() {
  const {
    transactions, setTransactions,
    showUpload, setShowUpload,
    accountBalance, setAccountBalance,
    balanceHistory, setBalanceHistory
  } = useTransactions();

  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "Buchungsdatum", direction: "desc" });
  const [catSortConfig, setCatSortConfig] = useState<CategorySortConfig>({ key: "amount", direction: "desc" });
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // New States
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleUploadSuccess = (data: {
    transactions: Transaction[],
    metadata?: { balance?: number; balance_label?: string },
    balance_history?: any[]
  }) => {
    setIsDemoMode(false); // Reset demo mode on real upload
    setTransactions(data.transactions);
    setShowUpload(false);

    if (data.metadata?.balance !== undefined) {
      setAccountBalance({
        value: data.metadata.balance,
        label: data.metadata.balance_label || "Kontostand"
      });
    }

    if (data.balance_history) {
      setBalanceHistory(data.balance_history);
    }

    if (data.transactions.length > 0) {
      const dates = data.transactions.map(t => new Date(t.Buchungsdatum));
      setFromDate(new Date(Math.min(...dates.map(d => d.getTime()))));
      setToDate(new Date(Math.max(...dates.map(d => d.getTime()))));
    }
  };

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (fromDate || toDate) {
      const start = fromDate ? startOfDay(fromDate) : new Date(0);
      const end = toDate ? endOfDay(toDate) : new Date(8640000000000000);

      result = result.filter(t => {
        const d = new Date(t.Buchungsdatum);
        return isWithinInterval(d, { start, end });
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.Zahlungsempfänger.toLowerCase().includes(query) ||
        t.Verwendungszweck.toLowerCase().includes(query)
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const key = sortConfig.key as keyof Transaction;
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [transactions, fromDate, toDate, searchQuery, sortConfig]);

  const stats = useMemo(() => {
    if (filteredTransactions.length === 0) return { income: 0, expenses: 0, fixedCosts: 0, netFlow: 0 };
    const income = filteredTransactions.filter(t => t.Betrag > 0).reduce((sum, t) => sum + t.Betrag, 0);
    const expenses = filteredTransactions.filter(t => t.Betrag < 0).reduce((sum, t) => sum + Math.abs(t.Betrag), 0);
    const fixedCosts = filteredTransactions.filter(t => t.Fixkosten && t.Betrag < 0).reduce((sum, t) => sum + Math.abs(t.Betrag), 0);
    return { income, expenses, fixedCosts, netFlow: income - expenses };
  }, [filteredTransactions]);

  // Statistische Aufbereitung der Kategorien
  const categoryStats = useMemo(() => {
    const data: Record<string, { amount: number, count: number }> = {};
    const totalExpenses = filteredTransactions
      .filter(t => t.Betrag < 0)
      .reduce((sum, t) => sum + Math.abs(t.Betrag), 0);

    filteredTransactions.filter(t => t.Betrag < 0).forEach(t => {
      if (!data[t.Kategorie]) data[t.Kategorie] = { amount: 0, count: 0 };
      data[t.Kategorie].amount += Math.abs(t.Betrag);
      data[t.Kategorie].count += 1;
    });

    let result = Object.entries(data).map(([name, stats]) => ({
      name,
      amount: stats.amount,
      count: stats.count,
      share: totalExpenses > 0 ? (stats.amount / totalExpenses) * 100 : 0
    }));

    if (catSortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[catSortConfig.key];
        const bVal = b[catSortConfig.key];
        if (aVal < bVal) return catSortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return catSortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [filteredTransactions, catSortConfig]);

  // Transformierte Daten für Multi-Color BarChart
  const barChartData = useMemo(() => {
    if (categoryStats.length === 0) return [];
    // Erstelle ein Objekt mit allen Kategorien als Keys
    const dataRow: Record<string, number | string> = { name: "Ausgaben" };
    categoryStats.forEach(cat => {
      dataRow[cat.name] = cat.amount;
    });
    return [dataRow];
  }, [categoryStats]);

  const categoryNames = useMemo(() => categoryStats.map(c => c.name), [categoryStats]);

  const topTenTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => Math.abs(b.Betrag) - Math.abs(a.Betrag))
      .slice(0, 10);
  }, [filteredTransactions]);

  const handleCatSort = (key: keyof CategorySummary) => {
    setCatSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleDemoMode = async () => {
    setIsDemoLoading(true);
    try {
      // Lade Mock-CSV vom Backend-Endpunkt (funktioniert auf Vercel)
      const res = await fetch(`${API_BASE_URL}/api/demo-data`);
      if (!res.ok) throw new Error("Mock-Daten konnten nicht geladen werden");

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const csvText = data.csv_content;

      // Sende CSV an Backend zur Verarbeitung (Upload Simulation)
      const blob = new Blob([csvText], { type: "text/csv" });
      const file = new File([blob], "mock_data.csv", { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Backend-Verarbeitung fehlgeschlagen");

      const uploadData = await uploadRes.json();

      // Nutze die zentrale Erfolgs-Logik für Metadaten & Balance Ledger
      handleUploadSuccess(uploadData);

      // Demo-Modus State nachträglich setzen, da handleUploadSuccess ihn auf false setzt
      setIsDemoMode(true);
    } catch (err: any) {
      console.error("Demo Mode Error:", err);
      alert(`Demo-Modus konnte nicht geladen werden: ${err.message || "Stelle sicher, dass das Backend läuft."}`);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const togglePrompt = (p: string) => {
    setSelectedPrompts(prev => {
      const isSelected = prev.includes(p);
      const next = isSelected ? prev.filter(x => x !== p) : [...prev, p];
      setCustomPrompt(next.join("\n"));
      return next;
    });
  };

  const startAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiResponse(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_summaries: categoryStats,
          top_transactions: topTenTransactions,
          user_prompt: customPrompt || undefined
        })
      });
      const data = await res.json();
      if (data.response) {
        setAiResponse(data.response);
      } else if (data.error) {
        setAiResponse(`**Fehler:** ${data.error}`);
      }
    } catch (err) {
      console.error("AI Analysis Fetch Error:", err);
      setAiResponse("**Systemfehler:** Konnte keine Verbindung zum KI-Server herstellen.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chartData = useMemo(() => {
    const daily: Record<string, { Einnahmen: number, Ausgaben: number }> = {};
    [...filteredTransactions].sort((a, b) => a.Buchungsdatum.localeCompare(b.Buchungsdatum)).forEach(t => {
      const date = t.Buchungsdatum;
      if (!daily[date]) daily[date] = { Einnahmen: 0, Ausgaben: 0 };
      if (t.Betrag > 0) daily[date].Einnahmen += t.Betrag;
      else daily[date].Ausgaben += Math.abs(t.Betrag);
    });
    return Object.entries(daily).map(([date, data]) => ({ date, ...data }));
  }, [filteredTransactions]);

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const setRangeLastDays = (days: number) => {
    const to = new Date();
    setFromDate(subDays(to, days));
    setToDate(to);
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Datum", "Empfänger", "Verwendungszweck", "Betrag", "Kategorie", "Fixkosten"];
    const rows = filteredTransactions.map(t => [t.Buchungsdatum, t.Zahlungsempfänger, t.Verwendungszweck.replace(/;/g, ","), t.Betrag.toString().replace(".", ","), t.Kategorie, t.Fixkosten ? "Ja" : "Nein"]);
    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  console.log("CATEGORY STATS:", categoryStats);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-3">
              Dashboard
              {isDemoMode && (
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800 animate-pulse">
                  Demo-Modus aktiv
                </span>
              )}
            </h2>
            <p className="text-zinc-500 text-sm md:text-lg">Präzise Finanzanalyse in Echtzeit.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-xl border-zinc-200 dark:border-zinc-800"
          >
            <SettingsIcon size={18} className={showSettings ? "animate-spin" : ""} />
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={transactions.length === 0} className="rounded-xl"><Download size={18} className="mr-2" /> Export</Button>
          <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"><UploadIcon size={18} className="mr-2" /> CSV Upload</Button>
        </div>
      </div>

      {showSettings && (
        <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
            <SettingsIcon size={14} /> Einstellungen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase">Design & Modus</label>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                {[
                  { id: 'light', icon: <Sun size={14} />, label: 'Hell' },
                  { id: 'dark', icon: <Moon size={14} />, label: 'Dunkel' },
                  { id: 'system', icon: <Monitor size={14} />, label: 'System' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${theme === item.id
                      ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
            {isDemoMode && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase">Daten-Modus</label>
                <Button
                  variant="outline"
                  onClick={() => { setTransactions([]); setShowUpload(true); setIsDemoMode(false); }}
                  className="w-full rounded-xl border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                >
                  Mock-Daten löschen
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-50">
        <Card className="lg:col-span-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl overflow-visible">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-500 flex items-center gap-2"><Search size={16} /> Transaktionssuche</label>
              <Input placeholder="Nach Empfänger oder Verwendungszweck filtern..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="rounded-xl py-6" />
            </div>

            {transactions.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <label className="text-sm font-semibold text-zinc-500 flex items-center gap-2"><Calendar size={16} /> Zeitraum auswählen</label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Von</span>
                      <input
                        type="date"
                        value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : undefined)}
                        className="bg-transparent border-none text-sm font-mono focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Bis</span>
                      <input
                        type="date"
                        value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : undefined)}
                        className="bg-transparent border-none text-sm font-mono focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-auto">
                    {[7, 30, 90].map(d => (
                      <Button key={d} variant="outline" size="sm" onClick={() => setRangeLastDays(d)} className="h-9 px-4 rounded-lg text-xs font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">{d}d</Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {transactions.length === 0 && (
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl flex items-center gap-3">
                <HelpCircle size={20} className="text-blue-500" />
                <p className="text-xs text-blue-700 dark:text-blue-300">Lade deine DKB-Umsätze hoch, um die Filter-Optionen freizuschalten.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-2xl rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-blue-100/80 text-sm font-bold uppercase tracking-wider">Netto-Cashflow</p>
            <h3 className="text-5xl font-black mt-2 tracking-tight">{formatEuro(stats.netFlow)}</h3>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 flex justify-between">
            <div><p className="opacity-60 text-[10px] uppercase font-bold">Posten</p><p className="text-xl font-bold">{filteredTransactions.length}</p></div>
            {stats.expenses !== 0 && (
              <div className="text-right"><p className="opacity-60 text-[10px] uppercase font-bold">Fixkosten-Anteil</p><p className="text-xl font-bold">{Math.round((stats.fixedCosts / stats.expenses) * 100)}%</p></div>
            )}
          </div>
        </Card>
      </div>

      {transactions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-6">
          <UploadZone
            onUploadSuccess={handleUploadSuccess}
            onDemoClick={handleDemoMode}
            isDemoLoading={isDemoLoading}
          />
        </div>
      ) : (
        <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {accountBalance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BalanceCard
                balance={accountBalance.value}
                label={accountBalance.label}
                history={balanceHistory}
              />
              <Card className="col-span-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Sitzung Aktiv</span>
                </div>
                <h3 className="text-sm font-semibold mb-1">KI Architektur-Tipp</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Ihre Sitzung ist aktiv. Alle Analysen finden verschlüsselt im RAM statt.
                </p>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Einnahmen" value={formatEuro(stats.income)} icon={<ArrowUpRight size={20} className="text-emerald-500" />} />
            <StatCard title="Ausgaben" value={formatEuro(stats.expenses)} icon={<ArrowDownRight size={20} className="text-rose-500" />} />
            <StatCard title="Fixkosten" value={formatEuro(stats.fixedCosts)} icon={<RefreshCw size={20} className="text-blue-500" />} />
            <StatCard title="Frei Verfügbar" value={formatEuro(stats.income - stats.expenses)} icon={<Badge className="bg-zinc-200 text-zinc-700 text-[8px] h-4">NET</Badge>} />
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl p-6">
              <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Sparkles className="text-blue-500" size={24} /> KI-Analyse & Budget-Check
                    </CardTitle>
                    <p className="text-xs text-zinc-500 mt-1 uppercase font-black tracking-widest">Wähle Schwerpunkte für deine individuelle Analyse</p>
                  </div>
                  <Button
                    onClick={startAIAnalysis}
                    disabled={isAnalyzing || transactions.length === 0}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl hover:scale-105 transition-all h-14 px-8"
                  >
                    {isAnalyzing ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> KI analysiert...</>
                    ) : (
                      <><Sparkles size={20} className="mr-2" /> KI Analyse starten</>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {PREDEFINED_PROMPTS.map((p) => {
                    const isSelected = selectedPrompts.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => togglePrompt(p)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${isSelected
                          ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                          : "bg-white/50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                          }`}
                      >
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} className="opacity-30" />}
                        <span className="text-[11px] leading-tight">{p}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Finaler Analyse-Prompt (kombiniert)</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Wähle oben Optionen aus oder gib hier deine eigenen Fragen ein..."
                    className="w-full h-32 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {aiResponse && (
                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-2 duration-500 min-h-[200px] max-h-[400px] overflow-y-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 transition-all duration-300">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Kategorien im Detail</h4>
                  <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                        <TableRow>
                          <TableHead className="py-4 px-4 font-black text-[10px] uppercase tracking-widest text-zinc-400">Kategorie</TableHead>
                          <SortableHeader label="Summe" sortKey="amount" current={catSortConfig} onSort={handleCatSort} textAlign="right" />
                          <TableHead className="text-right py-4 px-4 font-black text-[10px] uppercase tracking-widest text-zinc-400">Anteil</TableHead>
                          <SortableHeader label="Anzahl" sortKey="count" current={catSortConfig} onSort={handleCatSort} textAlign="right" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryStats.map((item) => (
                          <TableRow key={item.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                            <TableCell className="font-bold text-sm py-3 px-4">{item.name}</TableCell>
                            <TableCell className="text-right font-mono text-sm py-3 px-4">{formatEuro(item.amount)}</TableCell>
                            <TableCell className="text-right py-3 px-4">
                              <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                {item.share.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-zinc-500 text-xs py-3 px-4">{item.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="lg:col-span-8 flex flex-col h-full">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">Visualisierung</h4>
                  <div className="flex-1 min-h-[300px]">
                    <BarChart
                      className="h-full"
                      data={barChartData}
                      index="name"
                      categories={categoryNames}
                      colors={CHART_COLORS}
                      layout="vertical"
                      yAxisWidth={150}
                      valueFormatter={(number) => Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(number)}
                      showAnimation={true}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl p-6 h-[480px]">
              <CardTitle className="mb-6">Zahlungsverlauf</CardTitle>
              <AreaChart className="h-[340px]" data={chartData} index="date" categories={["Einnahmen", "Ausgaben"]} colors={["emerald", "rose"]} valueFormatter={(val) => `${val.toLocaleString()} €`} showAnimation={true} />
            </Card>
          </div>

          <Card className="bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                  <TableRow>
                    <SortableHeader label="Datum" sortKey="Buchungsdatum" current={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Zahlungsempfänger" sortKey="Zahlungsempfänger" current={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Kategorie" sortKey="Kategorie" current={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Betrag" sortKey="Betrag" current={sortConfig} onSort={handleSort} textAlign="right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((t, i) => (
                    <TableRow key={i} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/80 transition-colors group">
                      <TableCell className="font-mono text-[11px] text-zinc-500">{format(new Date(t.Buchungsdatum), "dd.MM.yyyy")}</TableCell>
                      <TableCell>
                        <div className="font-black text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 transition-colors">{t.Zahlungsempfänger}</div>
                        <div className="text-[10px] text-zinc-400 italic truncate max-w-sm md:max-w-xl">{t.Verwendungszweck}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider px-2 py-0 h-5 border-zinc-200 dark:border-zinc-700">{t.Kategorie}</Badge></TableCell>
                      <TableCell className={`text-right font-black text-sm ${t.Betrag > 0 ? "text-emerald-600" : "text-zinc-900 dark:text-zinc-100"}`}>{formatEuro(t.Betrag)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredTransactions.length === 0 && (
              <div className="p-24 text-center">
                <FilterX size={48} className="mx-auto text-zinc-200 mb-4" />
                <p className="text-zinc-500 font-bold">Keine Daten für diesen Filter gefunden.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function SortableHeader({ label, sortKey, current, onSort, textAlign = "left" }: any) {
  const active = current.key === sortKey;
  return (
    <TableHead onClick={() => onSort(sortKey)} className="cursor-pointer group select-none py-4 px-6">
      <div className={`flex items-center gap-1.5 ${textAlign === "right" ? "justify-end" : ""}`}>
        <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-zinc-600 transition-colors">{label}</span>
        {active && (current.direction === "asc" ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />)}
      </div>
    </TableHead>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card className="bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm p-6 rounded-2xl group hover:shadow-lg transition-all duration-300 border-b-4 border-b-transparent hover:border-b-blue-500">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">{title}</p>
        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 group-hover:scale-110 transition-transform">{icon}</div>
      </div>
      <div className="text-2xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100">{value}</div>
    </Card>
  );
}

function formatEuro(val: number) {
  return val.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
