
export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
};

export type CrewMember = {
  id: string;
  name: string;
  type: 'Helper' | 'Partner';
  dailyRate?: number;
  profitPercentage?: number;
  email?: string;
  phone?: string;
  avatarUrl: string;
};

export type AdjustmentType = 'Time' | 'Material' | 'General';

export type Job = {
  id: string;
  title: string;
  quoteNumber: string;
  workOrderNumber?: string; // For backwards compatibility
  address: string;
  clientName: string;
  startDate: string; // ISO date string
  deadline: string; // ISO date string
  finalizationDate?: string; // ISO date string
  specialRequirements: string;
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Open Payment' | 'Finalized';
  budget: number; // This can be considered 'Payout'
  initialValue: number;
  idealMaterialCost: number;
  idealNumberOfDays: number;
  productionDays: string[]; // Array of ISO date strings
  isFixedPay: boolean;
  invoices: { id: string; origin: string; amount: number; date: string; notes?: string; isPayoutDiscount?: boolean; paidByContractor?: boolean; isPayoutAddition?: boolean; }[];
  adjustments: { 
    id: string; 
    type: AdjustmentType;
    description: string; 
    value: number; 
    hourlyRate?: number; // The hourly rate at the time of adjustment for 'Time' type
  }[];
  crew: {
    crewMemberId: string;
    name: string;
    type: 'Helper' | 'Partner';
  }[];
  // Simplified income and expenses, stored directly on the job
  income?: { id: string; description: string; amount: number; date: string; }[];
  expenses?: { id: string; category: string; description: string; amount: number; date: string; }[];
};

export type GeneralExpense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string; // ISO date string
};

export type Expense = {
  id: string;
  jobId: string; 
  category: 'Materials' | 'Labor' | 'Transportation' | 'Other';
  description: string;
  amount: number;
  date: string; // ISO date string
};

export type Income = {
  id:string;
  jobId: string; 
  description: string;
  amount: number;
  date: string; // ISO date string
};

export type GeneralSettings = {
  id: 'global'; // Singleton document
  dailyPayTarget: number;
  idealMaterialCostPercentage: number;
  hourlyRate: number;
  sharePercentage: number;
  reportRecipients?: string[];
  taxRate?: number;
};

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    businessName?: string;
    businessLogoUrl?: string;
};

export type PayrollReport = {
  id: string;
  weekNumber: number;
  year: number;
  startDate: string; // ISO
  endDate: string; // ISO
  sentDate: string; // ISO
  recipientCount: number;
  totalPayout: number;
  jobCount: number;
  jobIds: string[];
};

