
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Job as JobType } from '@/app/lib/types'; 

// Simplified Zod schema for a Job based on the report's needs
const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  clientName: z.string(),
  workOrderNumber: z.string(),
  deadline: z.string(),
  initialValue: z.number(),
  invoices: z.array(z.object({
      id: z.string(),
      amount: z.number(),
      date: z.string(),
      notes: z.string().optional(),
      origin: z.string(),
  })),
  adjustments: z.array(z.object({
      id: z.string(),
      type: z.enum(['Time', 'Material', 'General']),
      description: z.string(),
      value: z.number(),
      hourlyRate: z.number().optional(),
  })),
});

const PayrollReportInputSchema = z.object({
  jobs: z.array(JobSchema),
  currentDate: z.string(),
  globalHourlyRate: z.number(),
});

const PayrollReportOutputSchema = z.object({
  subject: z.string().describe('The subject line for the email.'),
  body: z.string().describe('The HTML body of the email.'),
});

export type PayrollReportInput = z.infer<typeof PayrollReportInputSchema>;
export type PayrollReportOutput = z.infer<typeof PayrollReportOutputSchema>;

export async function generatePayrollReport(input: PayrollReportInput): Promise<PayrollReportOutput> {
    return payrollReportFlow(input);
}


const prompt = ai.definePrompt({
    name: 'payrollReportPrompt',
    input: { schema: PayrollReportInputSchema },
    output: { schema: PayrollReportOutputSchema },
    prompt: `
      You are an assistant for a painting contractor. Your task is to generate a professional weekly payroll summary email.
      The current date is {{currentDate}}.
      The company's default hourly rate for adjustments is \${{globalHourlyRate}}/hr.

      The email should be in HTML format.
      The subject should be "Weekly Payroll Report - {{currentDate}}".

      The body should contain:
      1. A brief introduction.
      2. A summary section for each job that is ready for payout ("Open Payment" status).
      3. For each job, calculate the final payout. The formula is: initialValue - totalInvoiced + totalAdjustments.
         - totalInvoiced is the sum of all invoice amounts.
         - totalAdjustments is the sum of all adjustment values. For 'Time' adjustments, the value is 'value' * 'hourlyRate' (or the global rate if not specified). For others, it's just 'value'.
      4. Each job summary must include:
         - Job Title (client name and work order number)
         - Completion Date (deadline)
         - A calculated Final Payout amount.
      5. The email should end with a polite closing.

      Here is the data for the jobs to be included in the report:

      {{#each jobs}}
      - Job ID: {{id}}
        Title: {{clientName}} #{{workOrderNumber}}
        Completion Date: {{deadline}}
        Initial Value: \${{initialValue}}
        Invoices:
        {{#each invoices}}
          - \${{amount}} for {{origin}}
        {{/each}}
        Adjustments:
        {{#each adjustments}}
          - {{description}}: \${{value}} (Type: {{type}}{{#if hourlyRate}}, Rate: \${{hourlyRate}}/hr{{/if}})
        {{/each}}
      ---
      {{/each}}

      Generate the email now.
    `,
});


const payrollReportFlow = ai.defineFlow(
  {
    name: 'payrollReportFlow',
    inputSchema: PayrollReportInputSchema,
    outputSchema: PayrollReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
    
