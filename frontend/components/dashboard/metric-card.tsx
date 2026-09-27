"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  change: string;
  changeDirection: "up" | "down";
  summaryTitle: string;
  summarySubtitle: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeDirection,
  summaryTitle,
  summarySubtitle,
}: MetricCardProps) {
  const isUp = changeDirection === "up";
  const Icon = isUp ? TrendingUp : TrendingDown;
  const colorClass = isUp ? "text-emerald-500" : "text-rose-500";

  return (
    <Card className="hover:border-ring/50 transition-all shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
        <Badge variant="outline" className="gap-1 text-[11px] font-medium">
          <Icon className={`w-3 h-3 ${colorClass}`} />
          {change}
        </Badge>
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
        {value}
      </div>
      <div className="space-y-0.5 border-t border-border pt-2.5 sm:pt-3">
        <p className="text-xs font-medium text-foreground flex items-center gap-1">
          {summaryTitle}
          <Icon className={`w-3 h-3 inline ${colorClass}`} />
        </p>
        <p className="text-[11px] text-muted-foreground">
          {summarySubtitle}
        </p>
      </div>
    </Card>
  );
}
