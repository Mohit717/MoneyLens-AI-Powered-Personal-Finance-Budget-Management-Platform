"use client";

import React from "react";
import { Menu, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Translate from "./Translate";
import { SwitchLanguage } from "./SwitchLanguage";

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  return (
    <header className="h-16 border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 bg-background/95 backdrop-blur-sm z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Sheet Trigger Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileSidebar}
          className="lg:hidden cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
          <Translate text={"dashboard"}/>
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle (Light, Dark, System) */}
        <ThemeToggle />
        <SwitchLanguage />

        {/* Quick Create Action Button */}
        <Button
          size="sm"
          className="gap-1.5 sm:gap-2 text-xs font-semibold shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Quick Create</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>
    </header>
  );
}
