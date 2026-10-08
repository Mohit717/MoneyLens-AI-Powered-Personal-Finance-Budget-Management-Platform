"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutUserAction, getCurrentUserAction } from "@/app/actions/auth";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  CalendarClock,
  Sparkles,
  ShieldCheck,
  Wallet,
  Settings,
  HelpCircle,
  MoreVertical,
  User,
  CreditCard,
  Bell,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface SidebarNavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

export interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}

export const navSections: SidebarNavSection[] = [
  {
    title: "Finance Core",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { title: "Expenses & Budgets", icon: Receipt, href: "/expenses" },
      { title: "Investments", icon: TrendingUp, href: "/investments" },
      { title: "Cashflow & Dues", icon: CalendarClock, href: "/cashflow" },
    ],
  },
  {
    title: "Intelligence & Security",
    items: [
      { title: "AI Copilot", icon: Sparkles, href: "/copilot", badge: "AI" },
      { title: "Settings & Vault", icon: ShieldCheck, href: "/settings" },
    ],
  },
];

export const footerNavItems: SidebarNavItem[] = [
  { title: "Settings", icon: Settings, href: "/settings" },
  { title: "Get Help", icon: HelpCircle, href: "/help" },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen, onMobileOpenChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = React.useState<{
    name: string;
    email: string;
    avatarFallback: string;
  }>({
    name: "User",
    email: "user@example.com",
    avatarFallback: "U",
  });

  React.useEffect(() => {
    getCurrentUserAction().then((u) => {
      if (u) {
        setCurrentUser(u);
      }
    });
  }, []);

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Wallet className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground text-sm tracking-tight leading-tight">
              MoneyLens
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              AI Wealth & Budget
            </span>
          </div>
        </div>

        {/* Navigation Menu rendered from navSections array */}
        <div className="p-3 space-y-6 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider px-2 mb-2">
                {section.title}
              </p>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard" || pathname === "/"
                      : pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => onMobileOpenChange(false)}
                      className="block"
                    >
                      <Button
                        variant="ghost"
                        className={`w-full justify-between px-3 py-2 h-9 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                          <span>{item.title}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Footer rendered from footerNavItems array */}
      <div className="p-3 border-t border-sidebar-border space-y-3">
        <nav className="space-y-1">
          {footerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => onMobileOpenChange(false)}
                className="block"
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 px-3 py-2 h-9 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Bar with Shadcn DropdownMenu */}
        <div className="pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-2 h-auto rounded-xl hover:bg-sidebar-accent/60 cursor-pointer group border border-transparent hover:border-sidebar-border"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-8 h-8 rounded-lg border border-border">
                      <AvatarFallback className="rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {currentUser.avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-foreground leading-none">
                        {currentUser.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent side="top" align="start" className="w-64">
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 rounded-lg border border-primary/30">
                    <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-bold text-xs">
                      {currentUser.avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-foreground">
                      {currentUser.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2.5 text-xs">
                <User className="w-4 h-4 text-muted-foreground" />
                Profile & Nominee
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2.5 text-xs">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                Accounts & Wallets
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2.5 text-xs">
                <Bell className="w-4 h-4 text-muted-foreground" />
                Due Date Alerts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await logoutUserAction();
                  } catch (err) {
                    console.error("Logout failed:", err);
                  } finally {
                    router.push("/login");
                    router.refresh();
                  }
                }}
                className="cursor-pointer gap-2.5 text-xs text-rose-500 focus:text-rose-500"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          {renderSidebarContent()}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden lg:flex flex-col justify-between shrink-0 select-none">
        {renderSidebarContent()}
      </aside>
    </>
  );
}
