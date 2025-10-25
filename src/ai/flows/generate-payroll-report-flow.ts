
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
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
  businessLogoUrl: z.string().optional().describe("The URL for the user's business logo."),
  totalPayout: z.number().describe("The sum of all job payouts in this report."),
});

const PayrollReportOutputSchema = z.object({
  subject: z.string().describe('The subject line for the email.'),
  body: z.string().describe('The HTML body of the email. Use tables and inline styles for a professional look.'),
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
      The output must be a single HTML document. Use inline CSS for styling. Do not use any <style> tags.

      The subject line should be: "{{#if businessName}}{{businessName}}: {{/if}}Weekly Payroll Report - Week {{weekNumber}}".

      The email body should have the following structure:
      1. A container with a light gray background (#f7f7f7).
      2. A header section with the business logo (if provided), business name, and report title.
      3. A main content section with an introduction and a list of jobs.
      4. Each job should be presented in its own table for clarity.
      5. A summary section with the total payout.
      6. A simple footer.

      Here is the detailed HTML structure to follow. Fill in the placeholders like {{businessName}}, {{weekNumber}}, etc. with the provided data.

      \`\`\`html
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Weekly Payroll Report</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f7f7;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="20" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="border-bottom: 1px solid #dddddd; padding-bottom: 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        {{#if businessLogoUrl}}
                        <td align="left" style="width: 80px;">
                          <img src="{{businessLogoUrl}}" alt="{{businessName}} Logo" width="60" height="60" style="border-radius: 50%;">
                        </td>
                        {{/if}}
                        <td align="left" style="font-size: 24px; font-weight: bold; color: #333333;">
                          {{#if businessName}}{{businessName}}{{else}}Weekly Report{{/if}}
                        </td>
                        <td align="right" style="font-size: 14px; color: #777777;">
                          Week {{weekNumber}}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Intro -->
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0;">
                      Here are the jobs with Open Payment status for the period from <strong>{{startDate}}</strong> to <strong>{{endDate}}</strong>:
                    </p>
                  </td>
                </tr>
                <!-- Jobs List -->
                <tr>
                  <td>
                    {{#each jobs}}
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #eeeeee; border-radius: 6px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 15px;">
                          <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #333333;">{{this.clientName}} #{{this.workOrderNumber}}</p>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555;"><strong>Start Date:</strong> {{this.startDate}}</td></tr>
                            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555;"><strong>Conclusion Date:</strong> {{this.deadline}}</td></tr>
                            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555;"><strong>Payout:</strong> <span style="font-weight: bold; color: #1a73e8;">\${{this.payout}}</span></td></tr>
                            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555;"><strong>Material Usage:</strong> {{this.materialUsage}}%</td></tr>
                            <tr><td style="padding: 8px 0 0 0; font-size: 14px; color: #555555;"><strong>Notes:</strong><br>{{this.notes}}</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    {{/each}}
                  </td>
                </tr>
                <!-- Total -->
                <tr>
                  <td align="right" style="padding-top: 20px; border-top: 1px solid #dddddd;">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 16px; color: #555555;">Total Payout:</td>
                        <td style="font-size: 20px; font-weight: bold; color: #333333; padding-left: 15px;">\${{totalPayout}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding-top: 30px; font-size: 12px; color: #999999;">
                    <p>This is an automated report from PaintFlow.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      \`\`\`
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
    

    
