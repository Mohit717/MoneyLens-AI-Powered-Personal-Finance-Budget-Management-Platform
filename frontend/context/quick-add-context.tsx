"use client";

import React, { createContext, useContext, useState } from "react";
import { TransactionType } from "@/utils/types";

interface QuickAddContextType {
  isOpen: boolean;
  defaultType: TransactionType;
  openQuickAdd: (type?: TransactionType) => void;
  closeQuickAdd: () => void;
}

const QuickAddContext = createContext<QuickAddContextType | undefined>(undefined);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<TransactionType>("EXPENSE");

  const openQuickAdd = (type: TransactionType = "EXPENSE") => {
    setDefaultType(type);
    setIsOpen(true);
  };

  const closeQuickAdd = () => {
    setIsOpen(false);
  };

  return (
    <QuickAddContext.Provider
      value={{ isOpen, defaultType, openQuickAdd, closeQuickAdd }}
    >
      {children}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error("useQuickAdd must be used within a QuickAddProvider");
  }
  return context;
}
