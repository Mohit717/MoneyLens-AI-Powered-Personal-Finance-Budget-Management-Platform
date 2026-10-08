export interface PresetCategory {
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  icon: string;
  color: string;
  subcategories?: {
    name: string;
    icon: string;
    color: string;
  }[];
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  // EXPENSES
  {
    name: 'Food & Dining',
    type: 'EXPENSE',
    icon: 'Utensils',
    color: '#F59E0B',
    subcategories: [
      { name: 'Groceries', icon: 'ShoppingCart', color: '#F59E0B' },
      { name: 'Restaurants & Cafes', icon: 'Coffee', color: '#FBBF24' },
      { name: 'Food Delivery', icon: 'Truck', color: '#D97706' },
    ],
  },
  {
    name: 'Housing & Utilities',
    type: 'EXPENSE',
    icon: 'Home',
    color: '#3B82F6',
    subcategories: [
      { name: 'Rent', icon: 'Key', color: '#3B82F6' },
      { name: 'Electricity & Water', icon: 'Zap', color: '#60A5FA' },
      { name: 'Internet & Mobile', icon: 'Wifi', color: '#2563EB' },
      { name: 'Maintenance', icon: 'Wrench', color: '#1D4ED8' },
    ],
  },
  {
    name: 'Transportation',
    type: 'EXPENSE',
    icon: 'Car',
    color: '#EC4899',
    subcategories: [
      { name: 'Fuel', icon: 'Fuel', color: '#EC4899' },
      { name: 'Public Transit & Cabs', icon: 'Bus', color: '#F472B6' },
      { name: 'Vehicle Service', icon: 'Settings', color: '#DB2777' },
    ],
  },
  {
    name: 'Shopping & Discretionary',
    type: 'EXPENSE',
    icon: 'ShoppingBag',
    color: '#8B5CF6',
    subcategories: [
      { name: 'Clothing & Apparel', icon: 'Shirt', color: '#8B5CF6' },
      { name: 'Electronics & Gadgets', icon: 'Smartphone', color: '#A78BFA' },
      { name: 'Personal Care', icon: 'Sparkles', color: '#7C3AED' },
    ],
  },
  {
    name: 'Healthcare & Medical',
    type: 'EXPENSE',
    icon: 'HeartPulse',
    color: '#EF4444',
    subcategories: [
      { name: 'Medicines & Pharmacy', icon: 'Pill', color: '#EF4444' },
      { name: 'Doctor Consultation', icon: 'Stethoscope', color: '#F87171' },
      { name: 'Health Insurance', icon: 'Shield', color: '#DC2626' },
    ],
  },
  {
    name: 'Entertainment & Leisure',
    type: 'EXPENSE',
    icon: 'Film',
    color: '#14B8A6',
    subcategories: [
      { name: 'Streaming Subscriptions', icon: 'Tv', color: '#14B8A6' },
      { name: 'Movies & Events', icon: 'Ticket', color: '#2DD4BF' },
      { name: 'Travel & Vacation', icon: 'Plane', color: '#0D9488' },
    ],
  },
  {
    name: 'Education & Learning',
    type: 'EXPENSE',
    icon: 'GraduationCap',
    color: '#06B6D4',
    subcategories: [
      { name: 'Courses & Tuition', icon: 'BookOpen', color: '#06B6D4' },
      { name: 'Books & Supplies', icon: 'Bookmark', color: '#22D3EE' },
    ],
  },

  // INCOME
  {
    name: 'Salary & Wages',
    type: 'INCOME',
    icon: 'Briefcase',
    color: '#10B981',
  },
  {
    name: 'Freelance & Consulting',
    type: 'INCOME',
    icon: 'Laptop',
    color: '#34D399',
  },
  {
    name: 'Dividends & Interest',
    type: 'INCOME',
    icon: 'TrendingUp',
    color: '#059669',
  },
  {
    name: 'Rental Income',
    type: 'INCOME',
    icon: 'Key',
    color: '#0D9488',
  },
  {
    name: 'Other Income',
    type: 'INCOME',
    icon: 'PlusCircle',
    color: '#6EE7B7',
  },

  // INVESTMENT
  {
    name: 'Mutual Funds & SIP',
    type: 'INVESTMENT',
    icon: 'TrendingUp',
    color: '#2563EB',
  },
  {
    name: 'LIC & Traditional Policies',
    type: 'INVESTMENT',
    icon: 'Shield',
    color: '#1D4ED8',
  },
  {
    name: 'Sukanya Samriddhi (SKY)',
    type: 'INVESTMENT',
    icon: 'Sparkles',
    color: '#7C3AED',
  },
  {
    name: 'National Pension Scheme (NPS)',
    type: 'INVESTMENT',
    icon: 'Landmark',
    color: '#4F46E5',
  },
  {
    name: 'Provident Fund (EPF / PPF)',
    type: 'INVESTMENT',
    icon: 'PiggyBank',
    color: '#9333EA',
  },
  {
    name: 'Stocks & Equities',
    type: 'INVESTMENT',
    icon: 'BarChart3',
    color: '#0284C7',
  },
  {
    name: 'Gold & Precious Metals',
    type: 'INVESTMENT',
    icon: 'Coins',
    color: '#D97706',
  },
];

