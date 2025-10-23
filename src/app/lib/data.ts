import type { Subcontractor, Job, Income, Expense } from "./types";

export const subcontractors: Subcontractor[] = [
  {
    id: "sub1",
    name: "Jake's Painting Co.",
    phone: "555-123-4567",
    email: "jake@paintingco.com",
    avatarUrl: "https://picsum.photos/seed/sub1/200/200",
  },
  {
    id: "sub2",
    name: "Maria's Painting Services",
    phone: "555-987-6543",
    email: "maria@paintingservices.com",
    avatarUrl: "https://picsum.photos/seed/sub2/200/200",
  },
  {
    id: "sub3",
    name: "Anna's Fine Finishes",
    phone: "555-555-5555",
    email: "anna@finefinishes.com",
    avatarUrl: "https://picsum.photos/seed/sub3/200/200",
  },
];

export const jobs: Job[] = [
  {
    id: "job1",
    title: "Modern Kitchen Repaint",
    address: "123 Main St, Anytown, USA",
    clientName: "Alice Johnson",
    clientPhone: "555-111-2222",
    deadline: "2024-08-15T00:00:00.000Z",
    specialRequirements: "Low-VOC paint required. Protect granite countertops.",
    status: "In Progress",
    subcontractorId: "sub1",
    budget: 2500,
  },
  {
    id: "job2",
    title: "Exterior Fence Staining",
    address: "456 Oak Ave, Anytown, USA",
    clientName: "Bob Williams",
    clientPhone: "555-333-4444",
    deadline: "2024-08-20T00:00:00.000Z",
    specialRequirements: "Use weather-resistant stain. Two coats needed.",
    status: "Pending",
    subcontractorId: "sub2",
    budget: 1200,
  },
  {
    id: "job3",
    title: "Living Room Accent Wall",
    address: "789 Pine Ln, Anytown, USA",
    clientName: "Charlie Brown",
    clientPhone: "555-555-6666",
    deadline: "2024-07-28T00:00:00.000Z",
    specialRequirements: "Client wants a very specific shade of blue (Benjamin Moore Hale Navy).",
    status: "Completed",
    subcontractorId: "sub1",
    budget: 800,
  },
  {
    id: "job4",
    title: "Full Interior - New Construction",
    address: "101 Builder's Way, Anytown, USA",
    clientName: "Pro Homes LLC",
    clientPhone: "555-777-8888",
    deadline: "2024-09-30T00:00:00.000Z",
    specialRequirements: "Standard builder-grade white for all walls and ceilings.",
    status: "Pending",
    subcontractorId: null,
    budget: 15000,
  },
  {
    id: "job5",
    title: "Deck Refinishing",
    address: "212 Lakeview Dr, Anytown, USA",
    clientName: "Diana Prince",
    clientPhone: "555-999-0000",
    deadline: "2024-08-25T00:00:00.000Z",
    specialRequirements: "Power wash before sanding and staining.",
    status: "In Progress",
    subcontractorId: "sub2",
    budget: 1800,
  },
  {
    id: "job6",
    title: "Nursery Painting",
    address: "333 Cradle Rock, Anytown, USA",
    clientName: "Eve Adams",
    clientPhone: "555-234-5678",
    deadline: "2024-08-10T00:00:00.000Z",
    specialRequirements: "Zero-VOC paint only. Two-tone wall with stencil.",
    status: "Invoiced",
    subcontractorId: "sub3",
    budget: 950,
  },
];

export const income: Income[] = [
    { id: "inc1", jobId: "job3", description: "Payment for Living Room Accent Wall", amount: 800, date: "2024-07-30T00:00:00.000Z" },
    { id: "inc2", jobId: "job6", description: "50% Deposit for Nursery Painting", amount: 475, date: "2024-08-01T00:00:00.000Z" },
];

export const expenses: Expense[] = [
    { id: "exp1", jobId: "job1", category: "Materials", description: "Sherwin-Williams Emerald (5 gal)", amount: 250, date: "2024-08-02T00:00:00.000Z" },
    { id: "exp2", jobId: "job3", category: "Materials", description: "Benjamin Moore Hale Navy (1 gal)", amount: 75, date: "2024-07-27T00:00:00.000Z" },
    { id: "exp3", jobId: "job1", category: "Labor", description: "Helper daily rate", amount: 150, date: "2024-08-02T00:00:00.000Z" },
    { id: "exp4", jobId: "job2", category: "Transportation", description: "Gas for work truck", amount: 55, date: "2024-08-01T00:00:00.000Z" },
];
