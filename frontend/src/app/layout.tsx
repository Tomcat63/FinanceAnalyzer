import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { version } from "../../package.json";

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
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto z-0 flex flex-col">
              <div className="flex-1">
                {children}
              </div>

              {/* Footer */}
              <footer className="p-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  v{version} | Build: {process.env.NEXT_PUBLIC_BUILD_ID || "Development-Build"}
                </p>
              </footer>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
