





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
  workOrderNumber: string;
  address: string;
  clientName: string;
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
  invoices: { id: string; origin: string; amount: number; date: string; notes?: string; }[];
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
};

export type Expense = {
  id: string;
  jobId: string; // Changed from projectId to jobId
  category: 'Materials' | 'Labor' | 'Transportation' | 'Other';
  description: string;
  amount: number;
  date: string; // ISO date string
};

export type Income = {
  id:string;
  jobId: string; // changed from projectId
  description: string;
  amount: number;
  date: string; // ISO date string
};

export type GeneralSettings = {
  id: 'global'; // Singleton document
  dailyPayTarget: number;
  idealMaterialCostPercentage: number;
  hourlyRate: number;
  reportRecipients?: string[];
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
