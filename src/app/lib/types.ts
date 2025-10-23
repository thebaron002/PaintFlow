export type Subcontractor = {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
};

export type Job = {
  id: string;
  title: string;
  address: string;
  clientName: string;
  clientPhone: string;
  deadline: string; // ISO date string
  specialRequirements: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Invoiced';
  subcontractorId: string | null;
  budget: number;
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
  id: string;
  jobId: string;
  description: string;
  amount: number;
  date: string; // ISO date string
};
