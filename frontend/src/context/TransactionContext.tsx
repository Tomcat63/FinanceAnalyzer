"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Transaction {
    Buchungsdatum: string;
    Zahlungsempfänger: string;
    Verwendungszweck: string;
    Betrag: number;
    Kategorie: string;
    Wiederkehrend: boolean;
    Fixkosten: boolean;
}

interface TransactionContextType {
    transactions: Transaction[];
    setTransactions: (txs: Transaction[]) => void;
    showUpload: boolean;
    setShowUpload: (show: boolean) => void;
    accountBalance: { value: number; label: string } | null;
    setAccountBalance: (balance: { value: number; label: string } | null) => void;
    balanceHistory: any[];
    setBalanceHistory: (history: any[]) => void;
    isDemoMode: boolean;
    setIsDemoMode: (isDemo: boolean) => void;
    clearAll: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showUpload, setShowUpload] = useState(true);
    const [accountBalance, setAccountBalance] = useState<{ value: number; label: string } | null>(null);
    const [balanceHistory, setBalanceHistory] = useState<any[]>([]);
    const [isDemoMode, setIsDemoMode] = useState(false);

    const clearAll = () => {
        setTransactions([]);
        setShowUpload(true);
        setAccountBalance(null);
        setBalanceHistory([]);
        setIsDemoMode(false);
    };

    return (
        <TransactionContext.Provider value={{
            transactions,
            setTransactions,
            showUpload,
            setShowUpload,
            accountBalance,
            setAccountBalance,
            balanceHistory,
            setBalanceHistory,
            isDemoMode,
            setIsDemoMode,
            clearAll
        }}>
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransactions() {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error("useTransactions must be used within a TransactionProvider");
    }
    return context;
}
