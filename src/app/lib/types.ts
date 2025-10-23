export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
};

export type Project = {
  id: string;
  title: string;
  workOrderNumber: string;
  address: string;
  clientId: string;
  startDate: string; // ISO date string
  deadline: string; // ISO date string
  specialRequirements: string;
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Open Payment' | 'Finalized';
  budget: number; // This can be considered 'Payout'
  initialValue: number;
  idealMaterialCost: number;
  idealNumberOfDays: number;
  productionDays: string[]; // Array of ISO date strings
  isFixedPay: boolean;
  // invoice and adjustment types will be simple for now
  invoices: { id: string; amount: number; date: string; }[];
  adjustments: { id: "adj1"; reason: string; amount: number; }[];
};

export type Expense = {
  id: string;
  projectId: string;
  category: 'Materials' | 'Labor' | 'Transportation' | 'Other';
  description: string;
  amount: number;
  date: string; // ISO date string
};

export type Income = {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  date: string; // ISO date string
};
