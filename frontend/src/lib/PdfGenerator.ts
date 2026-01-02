import jsPDF from "jspdf";
import { AdvisoryTip } from "@/hooks/useAdvisory";
import { format } from "date-fns";

export interface PdfData {
  status: {
    income: number;
    expenses: number;
    fixedCosts: number;
    balance: number;
  };
  tips: AdvisoryTip[];
  notes?: string;
  fixedTransactions: any[];
  buildId: string;
}

export const generateFinancialReport = async (data: PdfData): Promise<boolean> => {
  try {
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let currentY = 20;

    // Helper: Draw Colors & Fonts
    const blueColor = "#2563eb";
    const darkBlueColor = "#1e3a8a";
    const grayColor = "#64748b";
    const lightGrayColor = "#f1f5f9";
    const borderColor = "#e2e8f0";

    // --- Header ---
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(darkBlueColor);
    pdf.text("Finanzanalyse & Beratung", margin, currentY);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(grayColor);
    pdf.text(`Erstellt am ${format(new Date(), "dd.MM.yyyy HH:mm")}`, margin, currentY + 6);

    // Right side Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(blueColor);
    pdf.text("FinanceAnalyzer", pageWidth - margin, currentY, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(grayColor);
    pdf.text(`Build: ${data.buildId}`, pageWidth - margin, currentY + 5, { align: "right" });

    currentY += 15;
    // Blue Divider
    pdf.setDrawColor(blueColor);
    pdf.setLineWidth(1);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // --- Status Section (Cards) ---
    const cardWidth = (pageWidth - (margin * 2) - 10) / 2;
    const cardHeight = 35;

    // Card 1: Balance
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.setDrawColor(borderColor);
    pdf.roundedRect(margin, currentY, cardWidth, cardHeight, 3, 3, "FD");

    pdf.setFontSize(8);
    pdf.setTextColor(grayColor);
    pdf.setFont("helvetica", "bold");
    pdf.text("AKTUELLER KONTOSTAND", margin + 5, currentY + 10);

    pdf.setFontSize(18);
    pdf.setTextColor("#0f172a"); // slate-900
    pdf.setFont("helvetica", "bold");
    const balanceStr = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.status.balance);
    pdf.text(balanceStr, margin + 5, currentY + 22);

    // Card 2: Fixed Costs
    pdf.setFillColor(239, 246, 255); // blue-50
    pdf.setDrawColor("#bfdbfe"); // blue-200
    pdf.roundedRect(margin + cardWidth + 10, currentY, cardWidth, cardHeight, 3, 3, "FD");

    pdf.setFontSize(8);
    pdf.setTextColor(darkBlueColor);
    pdf.text("FIXKOSTEN-QUOTE", margin + cardWidth + 15, currentY + 10);

    const quote = data.status.income > 0 ? (data.status.fixedCosts / data.status.income) * 100 : 0;
    pdf.setFontSize(18);
    pdf.text(`${quote.toFixed(1)}%`, margin + cardWidth + 15, currentY + 22);

    // Progress Bar
    const barMaxWidth = cardWidth - 30; // padding
    const barY = currentY + 28;
    pdf.setFillColor("#bfdbfe");
    pdf.rect(margin + cardWidth + 15, barY, barMaxWidth, 2, "F");

    pdf.setFillColor(blueColor);
    const progressWidth = Math.min((quote / 100) * barMaxWidth, barMaxWidth);
    pdf.rect(margin + cardWidth + 15, barY, progressWidth, 2, "F");

    currentY += cardHeight + 15;

    // --- KI-Tips ---
    pdf.setFontSize(12);
    pdf.setTextColor(darkBlueColor);
    pdf.setFont("helvetica", "bold");
    // Blue indicator line
    pdf.setDrawColor(blueColor);
    pdf.setLineWidth(1.5);
    pdf.line(margin, currentY, margin, currentY + 5);
    pdf.text("KI-BERATUNG & INSIGHTS", margin + 4, currentY + 4);
    currentY += 10;

    data.tips.forEach(tip => {
      // Simple auto-height calculation
      // Title
      pdf.setFontSize(10);
      pdf.setTextColor(darkBlueColor);
      pdf.setFont("helvetica", "bold");
      pdf.text(tip.title, margin, currentY);

      // Stars
      // Actually helvetica handles unicode stars poorly in standard jsPDF without custom fonts.
      // Let's stick to text "Confidence: X/5" or use simple ASCII chars if stars fail, 
      // but standard jsPDF might not show unicode stars. 
      // Let's use simple text for strict safety: (Confidence: ***)
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(grayColor);
      pdf.text(`Konfidenz: ${tip.confidence}/5`, pageWidth - margin, currentY, { align: "right" });

      currentY += 5;

      // Description (Multi-line)
      pdf.setFontSize(10);
      pdf.setTextColor("#334155"); // slate-700
      const splitDesc = pdf.splitTextToSize(tip.description, pageWidth - (margin * 2));
      pdf.text(splitDesc, margin, currentY);

      currentY += (splitDesc.length * 5) + 8; // Line height approx 5mm + spacing
    });

    // --- User Notes ---
    if (data.notes) {
      currentY += 5;
      // Background Box
      pdf.setFillColor(240, 249, 255); // sky-50ish
      pdf.setDrawColor("#bfdbfe");
      // Calculate height based on text
      pdf.setFontSize(10);
      const splitNotes = pdf.splitTextToSize(data.notes, pageWidth - (margin * 2) - 10);
      const noteHeight = (splitNotes.length * 5) + 20;

      // Check page break
      if (currentY + noteHeight > pageHeight - 20) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), noteHeight, 3, 3, "FD");

      pdf.setFontSize(10);
      pdf.setTextColor(darkBlueColor);
      pdf.setFont("helvetica", "bold");
      pdf.text("MEINE NOTIZEN", margin + 5, currentY + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(darkBlueColor);
      pdf.text(splitNotes, margin + 5, currentY + 16);

      currentY += noteHeight + 15;
    } else {
      currentY += 10;
    }

    // --- Transactions Table ---
    if (currentY + 40 > pageHeight) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(darkBlueColor);
    pdf.setFont("helvetica", "bold");
    pdf.setDrawColor(blueColor);
    pdf.setLineWidth(1.5);
    pdf.line(margin, currentY, margin, currentY + 5);
    pdf.text("FIXKOSTEN (TOP 20)", margin + 4, currentY + 4);
    currentY += 10;

    // Table Header
    pdf.setFillColor("#f8fafc");
    pdf.rect(margin, currentY, pageWidth - (margin * 2), 8, "F");

    pdf.setFontSize(8);
    pdf.setTextColor(grayColor);
    pdf.setFont("helvetica", "bold");
    pdf.text("DATUM", margin + 2, currentY + 5);
    pdf.text("EMPFÄNGER", margin + 40, currentY + 5);
    pdf.text("BETRAG", pageWidth - margin - 2, currentY + 5, { align: "right" });

    currentY += 8;

    // Table Rows
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor("#0f172a"); // slate-900

    data.fixedTransactions.slice(0, 20).forEach((tx, index) => {
      if (currentY > pageHeight - 20) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.text(format(new Date(tx.Buchungsdatum), "dd.MM.yyyy"), margin + 2, currentY + 5);

      // Truncate Payee if too long
      let payee = tx.Zahlungsempfänger;
      if (payee.length > 50) payee = payee.substring(0, 47) + "...";
      pdf.text(payee, margin + 40, currentY + 5);

      const amountStr = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Math.abs(tx.Betrag));
      pdf.text(amountStr, pageWidth - margin - 2, currentY + 5, { align: "right" });

      // Bottom border
      pdf.setDrawColor("#f1f5f9");
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY + 8, pageWidth - margin, currentY + 8);

      currentY += 8;
    });

    if (data.fixedTransactions.length > 20) {
      currentY += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(grayColor);
      pdf.text(`... und ${data.fixedTransactions.length - 20} weitere Positionen`, pageWidth / 2, currentY, { align: "center" });
    }

    // --- Footer ---
    // Place at bottom of current page or strictly at bottom of A4? 
    // Usually footer is fixed at bottom of page.
    const footerY = pageHeight - 15;

    pdf.setFontSize(8);
    pdf.setTextColor(grayColor);
    pdf.text("Referenz-Grundlage: Verbraucherzentrale Benchmarks", pageWidth / 2, footerY, { align: "center" });

    // NATIVE LINK: We calculate the text width to center the link correctly
    // "Referenz-Grundlage: " is approx 30mm. 
    // Center alignment makes it tricky. 
    // Easier: Put the link on a new line or known position.
    // Or just make a wide hit area in the center.
    pdf.link((pageWidth / 2) - 20, footerY - 3, 40, 5, { url: "https://www.verbraucherzentrale.de" });

    pdf.text("FinanceAnalyzer Advisor Pro | Vertraulicher Bericht", pageWidth / 2, footerY + 5, { align: "center" });

    // Save
    pdf.save(`Finanzanalyse_Bericht_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    return true;

  } catch (error) {
    console.error("PDF Native Generation Error:", error);
    throw error;
  }
};
