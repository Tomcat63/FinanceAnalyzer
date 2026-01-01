"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTransactions } from "@/context/TransactionContext";

export function NavigationGuard({ children }: { children: React.ReactNode }) {
    const { status } = useTransactions();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const protectedRoutes = ["/kontostand", "/analyse"];

        if (status === "IDLE" && protectedRoutes.includes(pathname)) {
            console.log(`NavigationGuard: Redirecting from ${pathname} to / due to IDLE status`);
            router.replace("/");
        }
    }, [status, pathname, router]);

    return <>{children}</>;
}
