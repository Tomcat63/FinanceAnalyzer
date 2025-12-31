import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LayoutDashboard, Receipt, ShoppingCart, User, Settings, PieChart } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Analyzer",
  description: "AI-powered financial analysis dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen relative overflow-hidden">
            {/* Background elements for glassmorphism */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex flex-col z-10">
              <div className="p-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FinanceAnalyzer
                </h1>
              </div>
              <nav className="flex-1 px-4 space-y-1">
                <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
                <NavItem icon={<Receipt size={20} />} label="Transaktionen" />
                <NavItem icon={<PieChart size={20} />} label="Analyse" />
                <NavItem icon={<ShoppingCart size={20} />} label="Abos" />
              </nav>
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <NavItem icon={<Settings size={20} />} label="Einstellungen" />
                <NavItem icon={<User size={20} />} label="Profil" />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto z-0">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${active
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
      : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
