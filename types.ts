
export enum Category {
  FOOD = 'Food & Dining',
  SHOPPING = 'Clothing & Shopping',
  HEALTH = 'Health & Wellness',
  TRANSPORT = 'Travel & Transport',
  UTILITIES = 'Utilities & Bills',
  ENTERTAINMENT = 'Entertainment',
  HOUSING = 'Housing & Rent',
  MISC = 'Miscellaneous'
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: Category;
  originalDescription: string;
}

export interface ExpenseSummary {
  category: Category;
  total: number;
  count: number;
  color: string;
}

export interface AnalysisResult {
  transactions: Transaction[];
  totalAmount: number;
  currency: string;
}
