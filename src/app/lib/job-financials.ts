/**
 * Calculates the total value of all adjustments for a job.
 * Handles different hourly rates ($40 vs $80) and contract vs direct payout logic.
 */
export function calculateTotalAdjustments(
  adjustments: Job['adjustments'],
  settings: GeneralSettings | null,
  managementType: Job['managementType'] = 'Fixed'
): number {
  const fixedRate = settings?.fixedHourlyRate ?? 40;
  const clientRate = settings?.clientHourlyRate ?? 80;
  const selfShare = (settings?.selfShare ?? 52) / 100;
  const companyShare = (settings?.companyShare ?? 35) / 100;

  return (
    adjustments?.reduce((sum, adj) => {
      if (adj.isPayoutAddition === false) return sum;

      if (adj.type === "Time") {
        if (managementType === 'Self') {
          // Self Managed: Hourly adjustments add to contract at clientRate ($80)
          // Contractor gets their share (52%) of that.
          return sum + (adj.value * clientRate * selfShare);
        } else {
          // Fixed/Company Managed: Hourly adjustments add directly at fixedRate ($40)
          return sum + (adj.value * fixedRate);
        }
      }

      // Material Reimbursements (Handled in calculateJobPayout directly for clarity if needed, 
      // but here we keep the legacy simple sum unless isPayoutAddition is false)
      if (adj.type === "Material") {
        // We'll assume the 'value' passed to adjustments for material already represents what should be added.
        return sum + adj.value;
      }

      // General Adjustments
      if (managementType === 'Self') return sum + (adj.value * selfShare);
      if (managementType === 'Company') return sum + (adj.value * companyShare);

      return sum + adj.value;
    }, 0) ?? 0
  );
}

/**
 * Calculates the total Contract Value (what the company charges the client).
 */
export function calculateContractTotal(job: Job, settings: GeneralSettings | null): number {
  if (job.managementType === 'Fixed') return job.initialValue || 0;

  const baseContract = job.contractTotal || job.initialValue || 0;
  const clientRate = settings?.clientHourlyRate ?? 80;

  const adjustmentContractIncrease = job.adjustments?.reduce((sum, adj) => {
    // Only 'Time' and 'General' usually affect contract total
    if (adj.type === 'Time') return sum + (adj.value * clientRate);
    if (adj.type === 'General') return sum + adj.value; // For now assuming General is contract
    return sum;
  }, 0) ?? 0;

  return baseContract + adjustmentContractIncrease;
}

/**
 * Calculates the final payout for a job based on management type.
 */
export function calculateJobPayout(job: Job, settings: GeneralSettings | null): number {
  const managementType = job.managementType || 'Fixed';
  const companyShare = (settings?.companyShare ?? 35) / 100;
  const selfShare = (settings?.selfShare ?? 52) / 100;

  let basePayout = 0;

  if (managementType === 'Self') {
    basePayout = (job.contractTotal || 0) * selfShare;
  } else if (managementType === 'Company') {
    // Company Managed: 'initialValue' IS the payout amount already (user entered it directly).
    // We do NOT multiply by companyShare here, because the input was already the "Initial Payout".
    basePayout = job.initialValue || 0;
  } else {
    basePayout = job.initialValue || 0;
  }

  const totalAdjustments = calculateTotalAdjustments(job.adjustments, settings, managementType);
  const totalDiscounts = calculatePayoutDiscounts(job.invoices);
  const totalAdditions = calculatePayoutAdditions(job.invoices);

  // Invoices are NOT deducted from Company Managed by default, 
  // but calculatePayoutDiscounts filters by 'isPayoutDiscount', 
  // so if the user MANUALLY marks it (per latest request), it will still subtract.

  return basePayout + totalAdjustments - totalDiscounts + totalAdditions;
}

/**
 * Calculates the final profit for a job.
 */
export function calculateJobProfit(job: Job, settings: GeneralSettings | null): number {
  const payout = calculateJobPayout(job, settings);

  const nonContractorCosts = job.invoices
    ?.filter(inv => !inv.paidByContractor)
    .reduce((sum, inv) => sum + inv.amount, 0) ?? 0;

  return payout - nonContractorCosts;
}

/**
 * Calculates the total cost of all materials invoiced for a job.
 */
export function calculateMaterialCost(invoices: Job['invoices']): number {
  return invoices?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0;
}

/**
 * Calculates the contractor's cost for the job.
 */
export function calculateContractorCost(invoices: Job['invoices']): number {
  return invoices
    ?.filter(inv => inv.paidByContractor)
    .reduce((sum, inv) => sum + inv.amount, 0) ?? 0;
}

/**
 * Calculates the total amount of invoices that are marked as a discount from the payout.
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
 */
export function calculatePayoutAdditions(invoices: Job['invoices']): number {
  return (
    invoices
      ?.filter((inv) => inv.isPayoutAddition)
      .reduce((sum, inv) => sum + inv.amount, 0) ?? 0
  );
}
