"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Info, FileText, Check, Star, Loader2 } from "lucide-react";
import { AdvisoryTip, useAdvisory } from "@/hooks/useAdvisory";

interface AdvisoryPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedTips: AdvisoryTip[], notes: string) => void;
}

export function AdvisoryPreviewModal({ isOpen, onClose, onConfirm }: AdvisoryPreviewModalProps) {
    const { tips, setTips, loading } = useAdvisory();
    const [notes, setNotes] = React.useState("");

    const toggleTip = (id: string) => {
        setTips(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
    };

    const selectedCount = tips.filter(t => t.selected).length;

    const renderStars = (confidence: number) => {
        if (confidence >= 0.8) return "⭐⭐⭐";
        if (confidence >= 0.5) return "⭐⭐";
        return "⭐";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-0 gap-0">
                <DialogHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                            <FileText size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight">KI-Berater Vorschau</DialogTitle>
                            <DialogDescription className="font-medium text-zinc-500">
                                Bestätigen Sie die KI-Insights, die in Ihren PDF-Bericht aufgenommen werden sollen.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 py-2 max-h-[60vh] overflow-y-auto space-y-6">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 size={40} className="animate-spin text-blue-600" />
                            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">KI analysiert Benchmarks...</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {tips.map((tip) => (
                                    <Card
                                        key={tip.id}
                                        onClick={() => toggleTip(tip.id)}
                                        className={`cursor-pointer transition-all duration-300 border-2 rounded-2xl overflow-hidden ${tip.selected
                                            ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-lg scale-[1.02]"
                                            : "border-zinc-100 dark:border-zinc-800 bg-transparent opacity-60 grayscale"
                                            }`}
                                    >
                                        <CardContent className="p-5 flex gap-4">
                                            <div className={`mt-1 p-2 rounded-lg shrink-0 ${tip.type === "positive" ? "bg-emerald-500/10 text-emerald-600" :
                                                tip.type === "negative" ? "bg-rose-500/10 text-rose-600" :
                                                    "bg-blue-500/10 text-blue-600"
                                                }`}>
                                                {tip.type === "positive" ? <CheckCircle2 size={20} /> :
                                                    tip.type === "negative" ? <AlertTriangle size={20} /> :
                                                        <Info size={20} />}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-black text-sm uppercase tracking-wider">{tip.title}</h4>
                                                    <span className="text-sm" title={`Konfidenz: ${(tip.confidence * 100).toFixed(0)}%`}>
                                                        {renderStars(tip.confidence)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                                                    {tip.description}
                                                </p>
                                                <div className="pt-2 flex items-center justify-between">
                                                    <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-widest text-zinc-500">
                                                        {tip.category}
                                                    </span>
                                                    {tip.selected && (
                                                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                            <Check size={12} strokeWidth={4} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Ausgewählt</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-zinc-400" />
                                    <h4 className="font-black text-sm uppercase tracking-widest">Eigene Notizen</h4>
                                </div>
                                <textarea
                                    className="w-full min-h-[120px] p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-400"
                                    placeholder="Fügen Sie hier Ihre persönliche Einschätzung oder Notizen hinzu, die im PDF unter den Tipps erscheinen sollen..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="p-8 pt-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col w-full gap-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                {selectedCount} von {tips.length} Tipps ausgewählt
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl font-bold">Abbrechen</Button>
                            <Button
                                onClick={() => onConfirm(tips.filter(t => t.selected), notes)}
                                disabled={selectedCount === 0 || loading}
                                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl font-bold h-12"
                            >
                                PDF Bericht generieren
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
