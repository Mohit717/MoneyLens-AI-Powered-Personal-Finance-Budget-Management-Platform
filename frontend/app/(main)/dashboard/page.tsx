"use client";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { VisitorsChartCard } from "@/components/dashboard/visitors-chart-card";
import { DocumentsTableCard } from "@/components/dashboard/documents-table-card";

export default function DashboardPage() {

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
      {/* 4 Metric Cards Grid */}
      <MetricsGrid />

      {/* Visitors Chart Card */}
      <VisitorsChartCard />

      {/* Documents Outline Data Table Card */}
      <DocumentsTableCard />
    </div>
  );
}