import type { Client, Job, Income, Expense } from "./types";
import { addDays, subDays } from "date-fns";

export const clients: Client[] = [];

// Lista de jobs de exemplo para migração
export const jobs: Job[] = [
  {
    "id": "MIG-001",
    "title": "Johnson Residence Interior",
    "workOrderNumber": "WO-M01",
    "address": "456 Oak Avenue, Metropolis",
    "clientName": "Sarah Johnson",
    "startDate": subDays(new Date(), 10).toISOString(),
    "deadline": subDays(new Date(), 2).toISOString(),
    "specialRequirements": "Client requires low-VOC paint. Please cover all furniture meticulously.",
    "status": "Open Payment",
    "budget": 3500,
    "initialValue": 3200,
    "idealMaterialCost": 640,
    "idealNumberOfDays": 5,
    "productionDays": [
        subDays(new Date(), 10).toISOString(),
        subDays(new Date(), 9).toISOString(),
        subDays(new Date(), 8).toISOString(),
        subDays(new Date(), 5).toISOString(),
        subDays(new Date(), 4).toISOString(),
    ],
    "isFixedPay": false,
    "invoices": [
        { "id": "INV-M01-1", "origin": "Sherwin-Williams", "amount": 750, "date": subDays(new Date(), 11).toISOString(), "notes": "Paint and supplies", "isPayoutDiscount": true }
    ],
    "adjustments": [
        { "id": "ADJ-M01-1", "type": "Time", "description": "Extra day for ceiling repair", "value": 8, "hourlyRate": 55 }
    ],
    "crew": []
  },
  {
    "id": "MIG-002",
    "title": "Smith Exterior Project",
    "workOrderNumber": "WO-M02",
    "address": "123 Pine Street, Gotham",
    "clientName": "Mark Smith",
    "startDate": subDays(new Date(), 20).toISOString(),
    "deadline": subDays(new Date(), 12).toISOString(),
    "specialRequirements": "Power wash all surfaces before painting. Two coats required.",
    "status": "Finalized",
    "budget": 5200,
    "initialValue": 5200,
    "idealMaterialCost": 1040,
    "idealNumberOfDays": 8,
    "productionDays": [],
    "isFixedPay": true,
    "invoices": [],
    "adjustments": [],
    "crew": []
  },
  {
    "id": "MIG-003",
    "title": "Downtown Office Refresh",
    "workOrderNumber": "WO-M03",
    "address": "789 Main Plaza, Downtown",
    "clientName": "Prime Properties LLC",
    "startDate": new Date().toISOString(),
    "deadline": addDays(new Date(), 10).toISOString(),
    "specialRequirements": "Work must be done after business hours (6 PM to 2 AM).",
    "status": "In Progress",
    "budget": 8000,
    "initialValue": 8000,
    "idealMaterialCost": 1600,
    "idealNumberOfDays": 10,
    "productionDays": [
        new Date().toISOString(),
        addDays(new Date(), 1).toISOString()
    ],
    "isFixedPay": false,
    "invoices": [],
    "adjustments": [],
    "crew": []
  },
  {
    "id": "MIG-004",
    "title": "Lee Family Deck Staining",
    "workOrderNumber": "WO-M04",
    "address": "321 River Road, Lakeside",
    "clientName": "David Lee",
    "startDate": addDays(new Date(), 5).toISOString(),
    "deadline": addDays(new Date(), 7).toISOString(),
    "specialRequirements": "Use a semi-transparent, weather-resistant stain.",
    "status": "Not Started",
    "budget": 1200,
    "initialValue": 1200,
    "idealMaterialCost": 240,
    "idealNumberOfDays": 2,
    "productionDays": [],
    "isFixedPay": true,
    "invoices": [],
    "adjustments": [],
    "crew": []
  }
];

export const income: Income[] = [];

export const expenses: Expense[] = [];
