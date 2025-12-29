"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DonutChart, AreaChart, DateRangePicker, DateRangePickerValue } from "@tremor/react";
import { ArrowUpRight, ArrowDownRight, RefreshCw, Upload as UploadIcon, Download, Calendar } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/button";
import { de } from "date-fns/locale";

interface Transaction {
  Buchungsdatum: string;
  Zahlungsempfänger: string;
  Verwendungszweck: string;
  Betrag: number;
  Kategorie: string;
  Wiederkehrend: boolean;
  Fixkosten: boolean;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showUpload, setShowUpload] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangePickerValue>({
    from: undefined,
    to: undefined,
  });

  const handleUploadSuccess = (data: { transactions: Transaction[] }) => {
    setTransactions(data.transactions);
    setShowUpload(false);

    // Auto-set date range to cover all transactions
    if (data.transactions.length > 0) {
      const dates = data.transactions.map(t => new Date(t.Buchungsdatum));
      setDateRange({
        from: new Date(Math.min(...dates.map(d => d.getTime()))),
        to: new Date(Math.max(...dates.map(d => d.getTime()))),
      });
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!dateRange.from) return transactions;

    return transactions.filter(t => {
      const date = new Date(t.Buchungsdatum);
      const from = dateRange.from!;
      const to = dateRange.to || dateRange.from!;
      // Normalizing to midnight for clean comparison
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDate = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      const endDate = new Date(to.getFullYear(), to.getMonth(), to.getDate());

      return checkDate >= startDate && checkDate <= endDate;
    });
  }, [transactions, dateRange]);

  const stats = useMemo(() => {
    if (filteredTransactions.length === 0) return { income: 0, expenses: 0, fixedCosts: 0, netFlow: 0 };

    const income = filteredTransactions.filter(t => t.Betrag > 0).reduce((sum, t) => sum + t.Betrag, 0);
    const expenses = filteredTransactions.filter(t => t.Betrag < 0).reduce((sum, t) => sum + Math.abs(t.Betrag), 0);
    const fixedCosts = filteredTransactions.filter(t => t.Fixkosten && t.Betrag < 0).reduce((sum, t) => sum + Math.abs(t.Betrag), 0);
    const netFlow = income - expenses;

    return { income, expenses, fixedCosts, netFlow };
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTransactions.filter(t => t.Betrag < 0).forEach(t => {
      counts[t.Kategorie] = (counts[t.Kategorie] || 0) + Math.abs(t.Betrag);
    });
    return Object.entries(counts).map(([name, amount]) => ({ name, amount }));
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const monthly: Record<string, { Einnahmen: number, Ausgaben: number }> = {};
    const sorted = [...filteredTransactions].sort((a, b) => a.Buchungsdatum.localeCompare(b.Buchungsdatum));

    sorted.forEach(t => {
      const monthStr = t.Buchungsdatum.substring(0, 7);
      if (!monthly[monthStr]) monthly[monthStr] = { Einnahmen: 0, Ausgaben: 0 };
      if (t.Betrag > 0) monthly[monthStr].Einnahmen += t.Betrag;
      else monthly[monthStr].Ausgaben += Math.abs(t.Betrag);
    });

    return Object.entries(monthly).map(([date, data]) => ({ date, ...data }));
  }, [filteredTransactions]);

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ["Datum", "Empfänger", "Verwendungszweck", "Betrag", "Kategorie", "Fixkosten"];
    const rows = filteredTransactions.map(t => [
      t.Buchungsdatum,
      t.Zahlungsempfänger,
      t.Verwendungszweck.replace(/;/g, ","), // Avoid CSV breaking
      t.Betrag.toString().replace(".", ","),
      t.Kategorie,
      t.Fixkosten ? "Ja" : "Nein"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FinanceAnalyzer_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showUpload && transactions.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 md:p-8 space-y-8">
        <div className="text-center space-y-4 max-w-xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analysiere deine Finanzen mit KI
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg">
            Lade deine DKB-Kontoauszüge im CSV-Format hoch und erhalte sofort detaillierte Einblicke in dein Ausgabeverhalten.
          </p>
        </div>
        <UploadZone onUploadSuccess={handleUploadSuccess} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Übersicht</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base">Filtere deine Daten und exportiere deine Analyse.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2 flex-1 md:flex-none">
            <Download size={16} /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowUpload(true)} className="gap-2 flex-1 md:flex-none">
            <UploadIcon size={16} /> Neu
          </Button>
        </div>
      </div>

      {/* Date Filter & Quick Stats */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <Card className="w-full lg:w-auto p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
              <Calendar size={16} /> Zeitraum wählen
            </div>
            <DateRangePicker
              className="max-w-md mx-auto"
              value={dateRange}
              onValueChange={setDateRange}
              locale={de}
              selectPlaceholder="Zeitraum..."
              color="blue"
            />
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <StatCard title="Einnahmen" value={formatEuro(stats.income)} icon={<ArrowUpRight size={18} className="text-emerald-500" />} />
          <StatCard title="Ausgaben" value={formatEuro(stats.expenses)} icon={<ArrowDownRight size={18} className="text-rose-500" />} />
          <StatCard title="Fixkosten" value={formatEuro(stats.fixedCosts)} icon={<RefreshCw size={18} className="text-blue-500" />} />
          <StatCard title="Netto" value={formatEuro(stats.netFlow)} valueClass={stats.netFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Area Chart */}
        <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-all hover:shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[300px]">
            <AreaChart
              className="h-full"
              data={chartData}
              index="date"
              categories={["Einnahmen", "Ausgaben"]}
              colors={["emerald", "rose"]}
              valueFormatter={(number: number) => `${Intl.NumberFormat("de").format(number).toString()} €`}
              showAnimation={true}
            />
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-all hover:shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Kategorien</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[300px] flex items-center justify-center">
            {categoryData.length > 0 ? (
              <DonutChart
                className="h-full"
                data={categoryData}
                category="amount"
                index="name"
                valueFormatter={(number: number) => `${Intl.NumberFormat("de").format(number).toString()} €`}
                colors={["blue", "cyan", "indigo", "violet", "rose", "emerald"]}
              />
            ) : (
              <p className="text-zinc-500 text-sm">Keine Ausgabendaten im Zeitraum.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 p-4 md:p-6">
          <CardTitle className="text-lg">Transaktionen ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[100px] md:w-[120px]">Datum</TableHead>
                  <TableHead>Empfänger</TableHead>
                  <TableHead className="hidden md:table-cell">Kategorie</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t, idx) => (
                  <TableRow key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <TableCell className="text-zinc-500 font-mono text-[10px] md:text-xs">{t.Buchungsdatum}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <span className="truncate max-w-[120px] md:max-w-[250px]">{t.Zahlungsempfänger}</span>
                          {t.Wiederkehrend && <RefreshCw size={12} className="text-blue-500 shrink-0" />}
                        </div>
                        <div className="text-[10px] md:text-xs text-zinc-400 truncate max-w-[120px] md:max-w-md">{t.Verwendungszweck}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-normal text-[10px]">
                        {t.Kategorie}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold text-sm ${t.Betrag > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                      {t.Betrag.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatEuro(val: number) {
  return val.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function StatCard({ title, value, icon, valueClass = "" }: { title: string, value: string, icon?: React.ReactNode, valueClass?: string }) {
  return (
    <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:scale-[1.02]">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between pb-1 md:pb-2">
          <p className="text-[10px] md:text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">{title}</p>
          <div className="p-1 md:p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md shrink-0">{icon}</div>
        </div>
        <div className={`text-sm md:text-xl xl:text-2xl font-bold truncate ${valueClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
