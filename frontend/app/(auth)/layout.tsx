import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SwitchLanguage } from "@/components/SwitchLanguage";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-muted/40 dark:bg-background transition-colors duration-300">
      {/* Background Decorative Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-foreground font-semibold text-lg tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span>Acme Auth</span>
        </Link>
        <div className="flex items-center gap-3">
          <SwitchLanguage />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-muted-foreground border-t border-border/40 bg-background/60 backdrop-blur-xs">
        <p>© {new Date().getFullYear()} Acme Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

