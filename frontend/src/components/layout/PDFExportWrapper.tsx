"use client";

import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { AdvisoryPreviewModal } from "@/components/advisory/AdvisoryPreviewModal";
import { generateFinancialReport, PdfData } from "@/lib/PdfGenerator";
import { AdvisoryTip } from "@/hooks/useAdvisory";
import { toast } from "sonner";

export function PDFExportWrapper({ children }: { children: React.ReactNode }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { transactions, accountBalance, balanceHistory } = useTransactions();

    useEffect(() => {
        const handleOpenModal = () => setIsModalOpen(true);
        window.addEventListener('open-export-modal', handleOpenModal);
        return () => window.removeEventListener('open-export-modal', handleOpenModal);
    }, []);

    const handleConfirmPDF = async (selectedTips: AdvisoryTip[], notes: string) => {
        setIsModalOpen(false);
        const toastId = toast.loading("PDF Bericht wird generiert...", {
            description: "Bitte warten Sie einen Moment, während die Daten aufbereitet werden."
        });

        // Prepare data for PDF
        const income = transactions.filter(t => t.Betrag > 0).reduce((sum, t) => sum + t.Betrag, 0);
        const expenses = transactions.filter(t => t.Betrag < 0).reduce((sum, t) => sum + t.Betrag, 0);
        const fixedCosts = transactions.filter(t => t.Fixkosten).reduce((sum, t) => sum + Math.abs(t.Betrag), 0);
        const fixedTransactions = transactions.filter(t => t.Fixkosten).sort((a, b) => new Date(b.Buchungsdatum).getTime() - new Date(a.Buchungsdatum).getTime());

        const pdfData: PdfData = {
            status: {
                income,
                expenses,
                fixedCosts,
                balance: accountBalance?.value || 0
            },
            tips: selectedTips,
            notes: notes,
            fixedTransactions,
            buildId: process.env.NEXT_PUBLIC_BUILD_ID || "v0.1.0-dev"
        };

        try {
            await generateFinancialReport(pdfData);
            toast.success("PDF erfolgreich gespeichert!", {
                id: toastId,
                description: "Der Bericht wurde in deinem Download-Ordner abgelegt."
            });
        } catch (err) {
            console.error("PDF Generation failed:", err);
            toast.error("Export fehlgeschlagen", {
                id: toastId,
                description: "Beim Erstellen des PDFs ist ein unbekannter Fehler aufgetreten. Bitte versuche es erneut."
            });
        }
    };

    return (
        <>
            {children}
            <AdvisoryPreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmPDF}
            />
        </>
    );
}
