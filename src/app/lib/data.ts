import type { Client, Job, Income, Expense } from "./types";

export const clients: Client[] = [
  {
    id: "client1",
    name: "Pro Homes LLC",
    phone: "555-777-8888",
    email: "contact@prohomes.com",
    avatarUrl: "https://picsum.photos/seed/client1/200/200",
  },
  {
    id: "client2",
    name: "Urban Renovators",
    phone: "555-123-9999",
    email: "office@urbanrenovators.net",
    avatarUrl: "https://picsum.photos/seed/client2/200/200",
  },
  {
    id: "client3",
    name: "Alice Johnson",
    phone: "555-111-2222",
    email: "alice.j@email.com",
    avatarUrl: "https://picsum.photos/seed/client3/200/200",
  },
    {
    id: "client4",
    name: "Bob Williams",
    phone: "555-333-4444",
    email: "bob.w@email.com",
    avatarUrl: "https://picsum.photos/seed/client4/200/200",
  },
];

export const jobs: Job[] = [
  {
    id: "job1",
    title: "Modern Kitchen Repaint",
    address: "123 Main St, Anytown, USA",
    clientId: "client3",
    deadline: "2024-08-15T00:00:00.000Z",
    specialRequirements: "Low-VOC paint required. Protect granite countertops.",
    status: "In Progress",
    budget: 2500,
  },
  {
    id: "job2",
    title: "Exterior Fence Staining",
    address: "456 Oak Ave, Anytown, USA",
    clientId: "client4",
    deadline: "2024-08-20T00:00:00.000Z",
    specialRequirements: "Use weather-resistant stain. Two coats needed.",
    status: "Not Started",
    budget: 1200,
  },
  {
    id: "job3",
    title: "Living Room Accent Wall",
    address: "789 Pine Ln, Anytown, USA",
    clientId: "client3",
    deadline: "2024-07-28T00:00:00.000Z",
    specialRequirements: "Client wants a very specific shade of blue (Benjamin Moore Hale Navy).",
    status: "Complete",
    budget: 800,
  },
  {
    id: "job4",
    title: "Full Interior - New Construction",
    address: "101 Builder's Way, Anytown, USA",
    clientId: "client1",
    deadline: "2024-09-30T00:00:00.000Z",
    specialRequirements: "Standard builder-grade white for all walls and ceilings.",
    status: "Not Started",
    budget: 15000,
  },
  {
    id: "job5",
    title: "Deck Refinishing",
    address: "212 Lakeview Dr, Anytown, USA",
    clientId: "client2",
    deadline: "2024-08-25T00:00:00.000Z",
    specialRequirements: "Power wash before sanding and staining.",
    status: "In Progress",
    budget: 1800,
  },
  {
    id: "job6",
    title: "Nursery Painting",
    address: "333 Cradle Rock, Anytown, USA",
    clientId: "client3",
    deadline: "2024-08-10T00:00:00.000Z",
    specialRequirements: "Zero-VOC paint only. Two-tone wall with stencil.",
    status: "Open Payment",
    budget: 950,
  },
  {
    id: "job7",
    title: "Garage Floor Epoxy",
    address: "101 Builder's Way, Anytown, USA",
    clientId: "client1",
    deadline: "2024-07-20T00:00:00.000Z",
    specialRequirements: "Requires 3-day curing time.",
    status: "Finalized",
    budget: 3200,
  }
];

export const income: Income[] = [
    { id: "inc1", jobId: "job3", description: "Payment for Living Room Accent Wall", amount: 800, date: "2024-07-30T00:00:00.000Z" },
    { id: "inc2", jobId: "job6", description: "50% Deposit for Nursery Painting", amount: 475, date: "2024-08-01T00:00:00.000Z" },
    { id: "inc3", jobId: "job7", description: "Final Payment for Garage Epoxy", amount: 3200, date: "2024-07-25T00:00:00.000Z" },
];

export const expenses: Expense[] = [
    { id: "exp1", jobId: "job1", category: "Materials", description: "Sherwin-Williams Emerald (5 gal)", amount: 250, date: "2024-08-02T00:00:00.000Z" },
    { id: "exp2", jobId: "job3", category: "Materials", description: "Benjamin Moore Hale Navy (1 gal)", amount: 75, date: "2024-07-27T00:00:00.000Z" },
    { id: "exp3", jobId: "job1", category: "Labor", description: "Helper daily rate", amount: 150, date: "2024-08-02T00:00:00.000Z" },
    { id: "exp4", jobId: "job2", category: "Transportation", description: "Gas for work truck", amount: 55, date: "2024-08-01T00:00:00.000Z" },
];
