import type { Client, Job, Income, Expense } from "./types";
import { addDays, subDays } from "date-fns";

export const clients: Client[] = [];

// Lista de jobs foi removida para não ser mais usada na migração
export const jobs: Job[] = [];

export const income: Income[] = [];

export const expenses: Expense[] = [];
