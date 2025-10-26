
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config'; // Make sure this path is correct

const jobsData = [
    {
    id: "job1",
    title: "Modern Kitchen Repaint",
    workOrderNumber: "WO-001",
    address: "123 Main St, Anytown, USA",
    clientName: "Alice Johnson",
    startDate: "2024-08-12T00:00:00.000Z",
    deadline: "2024-08-15T00:00:00.000Z",
    specialRequirements: "Low-VOC paint required. Protect granite countertops.",
    status: "In Progress",
    budget: 2500,
    initialValue: 2200,
    idealMaterialCost: 400,
    idealNumberOfDays: 4,
    productionDays: ["2024-08-12T00:00:00.000Z", "2024-08-13T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [],
    adjustments: [{ id: "adj1", reason: "Extra coat on ceiling", amount: 300 }]
  },
  {
    id: "job2",
    title: "Exterior Fence Staining",
    workOrderNumber: "WO-002",
    address: "456 Oak Ave, Anytown, USA",
    clientName: "Bob Williams",
    startDate: "2024-08-18T00:00:00.000Z",
    deadline: "2024-08-20T00:00:00.000Z",
    specialRequirements: "Use weather-resistant stain. Two coats needed.",
    status: "Not Started",
    budget: 1200,
    initialValue: 1200,
    idealMaterialCost: 250,
    idealNumberOfDays: 3,
    productionDays: [],
    isFixedPay: true,
    invoices: [],
    adjustments: []
  },
  {
    id: "job3",
    title: "Living Room Accent Wall",
    workOrderNumber: "WO-003",
    address: "789 Pine Ln, Anytown, USA",
    clientName: "Alice Johnson",
    startDate: "2024-07-27T00:00:00.000Z",
    deadline: "2024-07-28T00:00:00.000Z",
    specialRequirements: "Client wants a very specific shade of blue (Benjamin Moore Hale Navy).",
    status: "Complete",
    budget: 800,
    initialValue: 800,
    idealMaterialCost: 100,
    idealNumberOfDays: 2,
    productionDays: ["2024-07-27T00:00:00.000Z", "2024-07-28T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [{id: 'inv1', origin: 'Final Payment', amount: 800, date: "2024-07-30T00:00:00.000Z"}],
    adjustments: []
  },
  {
    id: "job4",
    title: "Full Interior - New Construction",
    workOrderNumber: "WO-004",
    address: "101 Builder's Way, Anytown, USA",
    clientName: "Pro Homes LLC",
    startDate: "2024-09-15T00:00:00.000Z",
    deadline: "2024-09-30T00:00:00.000Z",
    specialRequirements: "Standard builder-grade white for all walls and ceilings.",
    status: "Not Started",
    budget: 15000,
    initialValue: 14000,
    idealMaterialCost: 3500,
    idealNumberOfDays: 10,
    productionDays: [],
    isFixedPay: false,
    invoices: [],
    adjustments: [{ id: "adj2", type: 'General', description: "Additional closets", value: 1000 }]
  },
  {
    id: "job5",
    title: "Deck Refinishing",
    workOrderNumber: "WO-005",
    address: "212 Lakeview Dr, Anytown, USA",
    clientName: "Urban Renovators",
    startDate: "2024-08-22T00:00:00.000Z",
    deadline: "2024-08-25T00:00:00.000Z",
    specialRequirements: "Power wash before sanding and staining.",
    status: "In Progress",
    budget: 1800,
    initialValue: 1800,
    idealMaterialCost: 300,
    idealNumberOfDays: 4,
    productionDays: ["2024-08-22T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [],
    adjustments: []
  },
  {
    id: "job6",
    title: "Nursery Painting",
    workOrderNumber: "WO-006",
    address: "333 Cradle Rock, Anytown, USA",
    clientName: "Alice Johnson",
    startDate: "2024-08-08T00:00:00.000Z",
    deadline: "2024-08-10T00:00:00.000Z",
    specialRequirements: "Zero-VOC paint only. Two-tone wall with stencil.",
    status: "Open Payment",
    budget: 950,
    initialValue: 950,
    idealMaterialCost: 150,
    idealNumberOfDays: 3,
    productionDays: ["2024-08-08T00:00:00.000Z", "2024-08-09T00:00:00.000Z", "2024-08-10T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [{id: 'inv2', origin: 'Deposit', amount: 475, date: "2024-08-01T00:00:00.000Z"}],
    adjustments: []
  },
  {
    id: "job7",
    title: "Garage Floor Epoxy",
    workOrderNumber: "WO-007",
    address: "101 Builder's Way, Anytown, USA",
    clientName: "Pro Homes LLC",
    startDate: "2024-07-18T00:00:00.000Z",
    deadline: "2024-07-20T00:00:00.000Z",
    specialRequirements: "Requires 3-day curing time.",
    status: "Finalized",
    budget: 3200,
    initialValue: 3200,
    idealMaterialCost: 800,
    idealNumberOfDays: 3,
    productionDays: ["2024-07-18T00:00:00.000Z", "2024-07-19T00:00:00.000Z", "2024-07-20T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [{id: 'inv3', origin: 'Final Payment', amount: 3200, date: "2024-07-25T00:00:00.000Z"}],
    adjustments: []
  }
];

const incomeData = [
    { id: "inc1", jobId: "job3", description: "Payment for Living Room Accent Wall", amount: 800, date: "2024-07-30T00:00:00.000Z" },
    { id: "inc2", jobId: "job6", description: "50% Deposit for Nursery Painting", amount: 475, date: "2024-08-01T00:00:00.000Z" },
    { id: "inc3", jobId: "job7", description: "Final Payment for Garage Epoxy", amount: 3200, date: "2024-07-25T00:00:00.000Z" },
];

const expensesData = [
    { id: "exp1", jobId: "job1", category: "Materials", description: "Sherwin-Williams Emerald (5 gal)", amount: 250, date: "2024-08-02T00:00:00.000Z" },
    { id: "exp2", jobId: "job3", category: "Materials", description: "Benjamin Moore Hale Navy (1 gal)", amount: 75, date: "2024-07-27T00:00:00.000Z" },
    { id: "exp3", jobId: "job1", category: "Labor", description: "Helper daily rate", amount: 150, date: "2024-08-02T00:00:00.000Z" },
    { id: "exp4", jobId: "job2", category: "Transportation", description: "Gas for work truck", amount: 55, date: "2024-08-01T00:00:00.000Z" },
];

const crewData = [
  {
    id: "crew1",
    name: "Jake's Painting Co.",
    type: "Partner",
    profitPercentage: 50,
    email: "jake@example.com",
    phone: "123-456-7890",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjExNDUzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: "crew2",
    name: "Maria's Painting Services",
    type: "Helper",
    dailyRate: 200,
    email: "maria@example.com",
    phone: "098-765-4321",
    avatarUrl: "https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc2MTE0NzUzOXww&ixlib=rb-4.1.0&q=80&w=1080"
  },
];


async function seedDatabase() {
  console.log('Starting database seed process...');

  try {
    const userId = "7aDfCRJ90HNiN2se655nys4glUX2";

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('Firebase initialized.');

    // Create a new batch
    const batch = writeBatch(db);

    // Add jobs
    const jobsCollection = collection(db, 'users', userId, 'jobs');
    jobsData.forEach(job => {
      const docRef = doc(jobsCollection, job.id);
      batch.set(docRef, job);
    });
    console.log(`${jobsData.length} jobs prepared for batch write for user ${userId}.`);

    // Add income
    const incomeCollection = collection(db, 'users', userId, 'income');
    incomeData.forEach(incomeItem => {
      const docRef = doc(incomeCollection, incomeItem.id);
      batch.set(docRef, incomeItem);
    });
    console.log(`${incomeData.length} income records prepared for batch write for user ${userId}.`);
    
    // Add expenses
    const expensesCollection = collection(db, 'users', userId, 'expenses');
    expensesData.forEach(expenseItem => {
      const docRef = doc(expensesCollection, expenseItem.id);
      batch.set(docRef, expenseItem);
    });
    console.log(`${expensesData.length} expense records prepared for batch write for user ${userId}.`);

     // Add crew (as a top-level collection, as per backend.json)
    const crewCollection = collection(db, 'crew');
    crewData.forEach(crewMember => {
      const docRef = doc(crewCollection, crewMember.id);
      batch.set(docRef, crewMember);
    });
    console.log(`${crewData.length} crew members prepared for batch write.`);

    // Commit the batch
    await batch.commit();
    console.log('Batch committed successfully. Database has been seeded.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // In a real script, you might want to properly close connections if needed,
    // but for this simple script, process.exit() is fine.
    process.exit(0);
  }
}

// Execute the function
seedDatabase();
