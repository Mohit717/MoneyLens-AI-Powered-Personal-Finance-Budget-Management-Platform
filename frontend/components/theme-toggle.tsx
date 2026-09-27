"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-8 w-8 opacity-50" />
    );
  }

  const themes = [
    { name: "light", label: "Light", icon: Sun },
    { name: "dark", label: "Dark", icon: Moon },
    { name: "system", label: "System", icon: Monitor },
  ];

  const currentThemeObj = themes.find((t) => t.name === theme) || themes[2];
  const CurrentIcon = currentThemeObj.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium cursor-pointer">
            <CurrentIcon className="w-3.5 h-3.5" />
            <span className="capitalize hidden sm:inline">{theme}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-36">
        {themes.map((t) => {
          const Icon = t.icon;
          const isSelected = theme === t.name;
          return (
            <DropdownMenuItem
              key={t.name}
              onClick={() => setTheme(t.name)}
              className="flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
