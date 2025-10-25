
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Job as JobType } from '@/app/lib/types'; 

// Zod schema based on the desired email output
const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  clientName: z.string(),
  workOrderNumber: z.string(),
  startDate: z.string().describe("The job's start date in MM/DD/YYYY format."),
  deadline: z.string().describe("The job's completion date in MM/DD/YYYY format."),
  payout: z.number().describe("The final calculated payout amount for the job."),
  materialUsage: z.number().describe("The material usage as a percentage."),
  notes: z.string().optional().describe("Any special requirements or notes for the job."),
});

const PayrollReportInputSchema = z.object({
  jobs: z.array(JobSchema),
  currentDate: z.string(),
  weekNumber: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  businessName: z.string().optional().describe("The name of the user's business."),
});

const PayrollReportOutputSchema = z.object({
  subject: z.string().describe('The subject line for the email.'),
  body: z.string().describe('The HTML body of the email. Use simple HTML tags like <p>, <strong>, and <br> for formatting.'),
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
      You are an assistant for a painting contractor.
      Your task is to generate a professional weekly payroll summary email listing jobs with an "Open Payment" status.

      The subject line should be: "{{#if businessName}}{{businessName}}: {{/if}}Weekly Payroll Report - Week {{weekNumber}}".

      The email body should be in simple HTML. Start with the following sentence:
      "Here are the jobs with Open Payment status for the period from {{startDate}} to {{endDate}}:"

      Then, for each job provided in the data, list the following details in this exact order and format:
      - Job Name: [Client Name] #[Work Order Number]
      - Start Date: [Start Date]
      - Conclusion Date: [Completion Date]
      - Payout: $[Payout Amount]
      - Material Usage: [Material Usage Percentage]%
      - Notes: [Notes]

      Here is the job data:

      {{#each jobs}}
      <p>
        <strong>Job Name:</strong> {{clientName}} #{{workOrderNumber}}<br>
        <strong>Start Date:</strong> {{startDate}}<br>
        <strong>Conclusion Date:</strong> {{deadline}}<br>
        <strong>Payout:</strong> \${{payout}}<br>
        <strong>Material Usage:</strong> {{materialUsage}}%<br>
        <strong>Notes:</strong> {{notes}}
      </p>
      ---
      {{/each}}

      Generate the HTML email now.
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
    
