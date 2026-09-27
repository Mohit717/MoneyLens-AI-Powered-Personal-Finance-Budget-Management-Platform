"use client";

import React from "react";
import { MetricCard, MetricCardProps } from "./metric-card";

const metricsData: MetricCardProps[] = [
  {
    title: "Total Revenue",
    value: "$1,250.00",
    change: "+12.5%",
    changeDirection: "up",
    summaryTitle: "Trending up this month",
    summarySubtitle: "Visitors for the last 6 months",
  },
  {
    title: "New Customers",
    value: "1,234",
    change: "-20%",
    changeDirection: "down",
    summaryTitle: "Down 20% this period",
    summarySubtitle: "Acquisition needs attention",
  },
  {
    title: "Active Accounts",
    value: "45,678",
    change: "+12.5%",
    changeDirection: "up",
    summaryTitle: "Strong user retention",
    summarySubtitle: "Engagement exceed targets",
  },
  {
    title: "Growth Rate",
    value: "4.5%",
    change: "+4.5%",
    changeDirection: "up",
    summaryTitle: "Steady performance increase",
    summarySubtitle: "Meets growth projections",
  },
];

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metricsData.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}

