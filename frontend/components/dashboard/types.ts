export interface TableRowItem {
  id: string;
  header: string;
  sectionType: string;
  status: "In Process" | "Done";
  target: number;
  limit: number;
  reviewer: string | null;
}

export interface ColumnVisibility {
  type: boolean;
  status: boolean;
  target: boolean;
  limit: boolean;
  reviewer: boolean;
}

