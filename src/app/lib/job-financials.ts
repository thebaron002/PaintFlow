
import type { Job, GeneralSettings } from "./types";

/**
 * Calculates the total value of all adjustments for a job.
 * @param adjustments - The list of adjustments from the job.
 * @param hourlyRate - The default hourly rate from global settings.
 * @returns The total monetary value of all adjustments.
 */
export function calculateTotalAdjustments(
  adjustments: Job['adjustments'],
  hourlyRate: number = 0
): number {
  return (
    adjustments?.reduce((sum, adj) => {
      if (adj.type === "Time") {
        const rate = adj.hourlyRate ?? hourlyRate;
        return sum + adj.value * rate;
      }
      return sum + adj.value;
    }, 0) ?? 0
  );
}

/**
 * Calculates the total amount of invoices that are marked as a discount from the payout.
 * @param invoices - The list of invoices from the job.
 * @returns The total amount to be discounted.
 */
export function calculatePayoutDiscounts(invoices: Job['invoices']): number {
  return (
    invoices
      ?.filter((inv) => inv.isPayoutDiscount)
      .reduce((sum, inv) => sum + inv.amount, 0) ?? 0
  );
}

/**
 * Calculates the total amount of invoices that are marked as an addition to the payout.
 * @param invoices - The list of invoices from the job.
 * @returns The total amount to be added.
 */
export function calculatePayoutAdditions(invoices: Job['invoices']): number {
  return (
    invoices
      ?.filter((inv) => inv.isPayoutAddition)
      .reduce((sum, inv) => sum + inv.amount, 0) ?? 0
  );
}


/**
 * Calculates the final payout for a job based on the standard formula.
 * Payout = Initial Value + Adjustments - Payout Discounts + Payout Additions
 * @param job - The job object.
 * @param settings - The global application settings (for default hourly rate).
 * @returns The calculated final payout amount.
 */
export function calculateJobPayout(job: Job, settings: GeneralSettings | null): number {
  const totalAdjustments = calculateTotalAdjustments(job.adjustments, settings?.hourlyRate);
  const totalDiscounts = calculatePayoutDiscounts(job.invoices);
  const totalAdditions = calculatePayoutAdditions(job.invoices);
  const payout = (job.initialValue || 0) + totalAdjustments - totalDiscounts + totalAdditions;
  return payout;
}

/**
 * Calculates the total cost of all materials invoiced for a job.
 * This is a general material cost calculation, not specific to profit.
 * @param invoices - The list of invoices from the job.
 * @returns The total material cost.
 */
export function calculateMaterialCost(invoices: Job['invoices']): number {
    return invoices?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0;
}


/**
 * Calculates the contractor's cost for the job.
 * This is the sum of all invoices marked as "Paid by the contractor".
 * @param invoices - The list of invoices from the job.
 * @returns The total cost borne by the contractor.
 */
export function calculateContractorCost(invoices: Job['invoices']): number {
    return invoices
        ?.filter(inv => inv.paidByContractor)
        .reduce((sum, inv) => sum + inv.amount, 0) ?? 0;
}


/**
 * Calculates the final profit for a job.
 * Profit = Initial Value + Adjustments - Discounts (where 'Paid by the contractor?' is false)
 * @param job - The job object.
 * @param settings - The global application settings.
 * @returns The calculated final profit.
 */
export function calculateJobProfit(job: Job, settings: GeneralSettings | null): number {
    const totalAdjustments = calculateTotalAdjustments(job.adjustments, settings?.hourlyRate);
    
    const nonContractorCosts = job.invoices
        ?.filter(inv => !inv.paidByContractor)
        .reduce((sum, inv) => sum + inv.amount, 0) ?? 0;

    return (job.initialValue || 0) + totalAdjustments - nonContractorCosts;
}
