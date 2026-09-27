"use client";

import React, { useState, useEffect } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data3Months = [
  { date: "Jun 24", desktop: 186, mobile: 80 },
  { date: "Jun 25", desktop: 305, mobile: 200 },
  { date: "Jun 26", desktop: 237, mobile: 120 },
  { date: "Jun 27", desktop: 273, mobile: 190 },
  { date: "Jun 28", desktop: 209, mobile: 130 },
  { date: "Jun 29", desktop: 214, mobile: 140 },
  { date: "Jun 30", desktop: 310, mobile: 220 },
];

const data30Days = [
  { date: "W1", desktop: 1200, mobile: 700 },
  { date: "W2", desktop: 2100, mobile: 1300 },
  { date: "W3", desktop: 1800, mobile: 1100 },
  { date: "W4", desktop: 2900, mobile: 1900 },
];

const data7Days = [
  { date: "Mon", desktop: 320, mobile: 180 },
  { date: "Tue", desktop: 450, mobile: 290 },
  { date: "Wed", desktop: 380, mobile: 210 },
  { date: "Thu", desktop: 510, mobile: 340 },
  { date: "Fri", desktop: 490, mobile: 310 },
  { date: "Sat", desktop: 280, mobile: 190 },
  { date: "Sun", desktop: 390, mobile: 230 },
];

export function VisitorsChartCard() {
  const [activeTimeRange, setActiveTimeRange] = useState("Last 3 months");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const timeRanges = ["Last 3 months", "Last 30 days", "Last 7 days"];

  let chartData = data3Months;
  if (activeTimeRange === "Last 30 days") chartData = data30Days;
  if (activeTimeRange === "Last 7 days") chartData = data7Days;

  return (
    <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <CardTitle className="text-sm sm:text-base font-semibold">
            Total Visitors
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Total for {activeTimeRange.toLowerCase()}
          </CardDescription>
        </div>
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto max-w-full bg-muted/60 p-1 rounded-lg border border-border text-xs whitespace-nowrap scrollbar-none">
          {timeRanges.map((tab) => (
            <Button
              key={tab}
              variant={activeTimeRange === tab ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTimeRange(tab)}
              className="h-7 text-xs px-2.5 sm:px-3 font-medium cursor-pointer"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart Container */}
      <div className="h-56 sm:h-64 w-full pt-2">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="desktopGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary, #000)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary, #000)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="mobileGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--muted-foreground, #666)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--muted-foreground, #666)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border, #e5e7eb)" opacity={0.5} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground, #888)", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground, #888)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover, #fff)",
                  borderColor: "var(--border, #ccc)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--popover-foreground, #000)",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="desktop"
                stroke="var(--primary, #000)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#desktopGradient)"
                name="Desktop Visitors"
              />
              <Area
                type="monotone"
                dataKey="mobile"
                stroke="var(--muted-foreground, #666)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#mobileGradient)"
                name="Mobile Visitors"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-muted/20 animate-pulse rounded-lg" />
        )}
      </div>
    </Card>
  );
}
