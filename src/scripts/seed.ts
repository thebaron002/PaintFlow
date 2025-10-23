import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config'; // Make sure this path is correct

// Raw data - In a real app, this might come from a JSON file or another source.
const clientsData = [
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

const jobsData = [
    {
    id: "job1",
    title: "Modern Kitchen Repaint",
    workOrderNumber: "WO-001",
    address: "123 Main St, Anytown, USA",
    clientId: "client3",
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
    clientId: "client4",
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
    clientId: "client3",
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
    invoices: [{id: 'inv1', amount: 800, date: "2024-07-30T00:00:00.000Z"}],
    adjustments: []
  },
  {
    id: "job4",
    title: "Full Interior - New Construction",
    workOrderNumber: "WO-004",
    address: "101 Builder's Way, Anytown, USA",
    clientId: "client1",
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
    adjustments: [{ id: "adj2", reason: "Additional closets", amount: 1000 }]
  },
  {
    id: "job5",
    title: "Deck Refinishing",
    workOrderNumber: "WO-005",
    address: "212 Lakeview Dr, Anytown, USA",
    clientId: "client2",
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
    clientId: "client3",
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
    invoices: [{id: 'inv2', amount: 475, date: "2024-08-01T00:00:00.000Z"}],
    adjustments: []
  },
  {
    id: "job7",
    title: "Garage Floor Epoxy",
    workOrderNumber: "WO-007",
    address: "101 Builder's Way, Anytown, USA",
    clientId: "client1",
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
    invoices: [{id: 'inv3', amount: 3200, date: "2024-07-25T00:00:00.000Z"}],
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


async function seedDatabase() {
  console.log('Starting database seed process...');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('Firebase initialized.');

    // Create a new batch
    const batch = writeBatch(db);

    // Add clients
    const clientsCollection = collection(db, 'clients');
    clientsData.forEach(client => {
      const docRef = collection(clientsCollection, client.id).doc();
      batch.set(docRef, client);
    });
    console.log(`${clientsData.length} clients prepared for batch write.`);

    // Add jobs
    const jobsCollection = collection(db, 'jobs');
    jobsData.forEach(job => {
      const docRef = collection(jobsCollection, job.id).doc();
      batch.set(docRef, job);
    });
    console.log(`${jobsData.length} jobs prepared for batch write.`);

    // Add income
    const incomeCollection = collection(db, 'income');
    incomeData.forEach(incomeItem => {
      const docRef = collection(incomeCollection, incomeItem.id).doc();
      batch.set(docRef, incomeItem);
    });
    console.log(`${incomeData.length} income records prepared for batch write.`);
    
    // Add expenses
    const expensesCollection = collection(db, 'expenses');
    expensesData.forEach(expenseItem => {
      const docRef = collection(expensesCollection, expenseItem.id).doc();
      batch.set(docRef, expenseItem);
    });
    console.log(`${expensesData.length} expense records prepared for batch write.`);

    // Commit the batch
    await batch.commit();
    console.log('Batch committed successfully. Database has been seeded.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // In a real script, you might want to properly close connections if needed,
    // but for this simple script, process.exit() is fine.
    console.log('Seed process finished.');
  }
}

// Execute the function
seedDatabase();
