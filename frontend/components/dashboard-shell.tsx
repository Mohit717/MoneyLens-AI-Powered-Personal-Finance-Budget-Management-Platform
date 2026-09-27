"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden transition-colors">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileOpenChange={setIsMobileSidebarOpen}
      />
      <main className="flex-1 flex flex-col bg-background overflow-y-auto min-w-0">
        <Topbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        {children}
      </main>
    </div>
  );
}

