"use client";

import React, { useState } from "react";
import {
  Columns,
  GripVertical,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  MoreHorizontal,
  Plus,
  Check,
  Trash2,
  Copy,
  Edit,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableRowItem, ColumnVisibility } from "./types";

const initialTableData: TableRowItem[] = [
  {
    id: "1",
    header: "Cover page",
    sectionType: "Cover page",
    status: "In Process",
    target: 18,
    limit: 5,
    reviewer: "Eddie Lake",
  },
  {
    id: "2",
    header: "Table of contents",
    sectionType: "Table of contents",
    status: "Done",
    target: 29,
    limit: 24,
    reviewer: "Eddie Lake",
  },
  {
    id: "3",
    header: "Executive summary",
    sectionType: "Narrative",
    status: "Done",
    target: 10,
    limit: 13,
    reviewer: "Eddie Lake",
  },
  {
    id: "4",
    header: "Technical approach",
    sectionType: "Narrative",
    status: "Done",
    target: 27,
    limit: 23,
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: "5",
    header: "Design",
    sectionType: "Narrative",
    status: "In Process",
    target: 2,
    limit: 16,
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: "6",
    header: "Capabilities",
    sectionType: "Narrative",
    status: "In Process",
    target: 20,
    limit: 8,
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: "7",
    header: "Integration with existing systems",
    sectionType: "Narrative",
    status: "In Process",
    target: 19,
    limit: 21,
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: "8",
    header: "Innovation and Advantages",
    sectionType: "Narrative",
    status: "Done",
    target: 25,
    limit: 26,
    reviewer: null,
  },
  {
    id: "9",
    header: "Overview of EMR's Innovative Solutions",
    sectionType: "Technical content",
    status: "Done",
    target: 7,
    limit: 23,
    reviewer: null,
  },
  {
    id: "10",
    header: "Advanced Algorithms and Machine Learning",
    sectionType: "Narrative",
    status: "Done",
    target: 30,
    limit: 28,
    reviewer: null,
  },
];

const availableReviewers = ["Eddie Lake", "Jamik Tashpulatov"];

export function DocumentsTableCard() {
  const [activeTab, setActiveTab] = useState("Outline");
  const [tableData, setTableData] = useState<TableRowItem[]>(initialTableData);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Column Visibility States
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    type: true,
    status: true,
    target: true,
    limit: true,
    reviewer: true,
  });

  const toggleColumnVisibility = (key: keyof ColumnVisibility) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === tableData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(tableData.map((item) => item.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((item) => item !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleAssignReviewer = (rowId: string, reviewerName: string) => {
    setTableData((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, reviewer: reviewerName } : row))
    );
  };

  const handleDeleteRow = (rowId: string) => {
    setTableData((prev) => prev.filter((row) => row.id !== rowId));
    setSelectedRows((prev) => prev.filter((id) => id !== rowId));
  };

  const handleDuplicateRow = (row: TableRowItem) => {
    const newRow: TableRowItem = {
      ...row,
      id: `${Date.now()}`,
      header: `${row.header} (Copy)`,
    };
    setTableData((prev) => [...prev, newRow]);
  };

  return (
    <Card className="p-4 sm:p-5 space-y-4 shadow-xs overflow-visible">
      {/* Table Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto max-w-full bg-muted/60 p-1 rounded-lg border border-border text-xs whitespace-nowrap scrollbar-none shrink-0">
          {[
            { name: "Outline" },
            { name: "Past Performance", badge: "3" },
            { name: "Key Personnel", badge: "2" },
            { name: "Focus Documents" },
          ].map((item) => (
            <Button
              key={item.name}
              variant={activeTab === item.name ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(item.name)}
              className="h-7 text-xs px-3 font-medium cursor-pointer gap-1.5"
            >
              <span>{item.name}</span>
              {item.badge && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Right Action Controls with Shadcn DropdownMenu & Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap sm:flex-nowrap">
          {/* Customize Columns Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer">
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Customize Columns</span>
                  <span className="sm:hidden">Columns</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-[11px] uppercase font-semibold text-muted-foreground">
                Visible Columns
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { key: "type", label: "Type" },
                { key: "status", label: "Status" },
                { key: "target", label: "Target" },
                { key: "limit", label: "Limit" },
                { key: "reviewer", label: "Reviewer" },
              ].map((col) => {
                const isChecked = visibleColumns[col.key as keyof ColumnVisibility];
                return (
                  <DropdownMenuItem
                    key={col.key}
                    onClick={() => toggleColumnVisibility(col.key as keyof ColumnVisibility)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span>{col.label}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newSection: TableRowItem = {
                id: `${Date.now()}`,
                header: "New Section",
                sectionType: "Narrative",
                status: "In Process",
                target: 10,
                limit: 10,
                reviewer: null,
              };
              setTableData([...tableData, newSection]);
            }}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </Button>
        </div>
      </div>

      {/* Shadcn Table Component */}
      <div className="border border-border rounded-lg overflow-x-auto min-h-[300px] w-full">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-8 text-center px-3">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground inline opacity-0" />
              </TableHead>
              <TableHead className="w-8 px-3">
                <Checkbox
                  checked={selectedRows.length === tableData.length && tableData.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold text-foreground px-3">Header</TableHead>
              {visibleColumns.type && <TableHead className="font-semibold text-foreground px-3">Section Type</TableHead>}
              {visibleColumns.status && <TableHead className="font-semibold text-foreground px-3">Status</TableHead>}
              {visibleColumns.target && <TableHead className="font-semibold text-foreground px-3">Target</TableHead>}
              {visibleColumns.limit && <TableHead className="font-semibold text-foreground px-3">Limit</TableHead>}
              {visibleColumns.reviewer && <TableHead className="font-semibold text-foreground px-3">Reviewer</TableHead>}
              <TableHead className="w-8 px-3"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => {
              const isSelected = selectedRows.includes(row.id);

              return (
                <TableRow
                  key={row.id}
                  className={isSelected ? "bg-accent/30" : ""}
                >
                  <TableCell className="text-center text-muted-foreground px-3">
                    <GripVertical className="w-3.5 h-3.5 cursor-grab hover:text-foreground inline" />
                  </TableCell>
                  <TableCell className="px-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectRow(row.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground px-3">
                    {row.header}
                  </TableCell>

                  {/* Section Type */}
                  {visibleColumns.type && (
                    <TableCell className="px-3">
                      <Badge variant="secondary" className="font-medium text-[11px]">
                        {row.sectionType}
                      </Badge>
                    </TableCell>
                  )}

                  {/* Status */}
                  {visibleColumns.status && (
                    <TableCell className="px-3">
                      {row.status === "Done" ? (
                        <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Done
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1.5 bg-muted text-muted-foreground border-border text-[11px]">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          In Process
                        </Badge>
                      )}
                    </TableCell>
                  )}

                  {/* Target */}
                  {visibleColumns.target && (
                    <TableCell className="font-medium text-foreground px-3">
                      {row.target}
                    </TableCell>
                  )}

                  {/* Limit */}
                  {visibleColumns.limit && (
                    <TableCell className="font-medium text-foreground px-3">
                      {row.limit}
                    </TableCell>
                  )}

                  {/* Reviewer Dropdown using Shadcn DropdownMenu */}
                  {visibleColumns.reviewer && (
                    <TableCell className="px-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] font-medium cursor-pointer">
                              <span>{row.reviewer || "Assign reviewer"}</span>
                              <ChevronDown className="w-3 h-3 opacity-60" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="start" className="w-44">
                          {availableReviewers.map((rev) => {
                            const isSelectedRev = row.reviewer === rev;
                            return (
                              <DropdownMenuItem
                                key={rev}
                                onClick={() => handleAssignReviewer(row.id, rev)}
                                className="flex items-center justify-between text-xs cursor-pointer"
                              >
                                <span>{rev}</span>
                                {isSelectedRev && (
                                  <Check className="w-3.5 h-3.5 text-primary" />
                                )}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}

                  {/* Row Actions Menu Dropdown using Shadcn DropdownMenu */}
                  <TableCell className="text-right px-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => {
                            const newName = prompt("Edit section title:", row.header);
                            if (newName) {
                              setTableData((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, header: newName } : r))
                              );
                            }
                          }}
                          className="gap-2 text-xs cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicateRow(row)}
                          className="gap-2 text-xs cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          Make a copy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => alert(`Favorited: ${row.header}`)}
                          className="gap-2 text-xs cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-muted-foreground" />
                          Favorite
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteRow(row.id)}
                          className="gap-2 text-xs text-rose-500 focus:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination & Status Footer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-muted-foreground pt-2">
        <div>
          <span>{selectedRows.length} of {tableData.length} row(s) selected.</span>
        </div>
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs px-2">
              10
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </div>
          <span>Page 1 of 1</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled>
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

