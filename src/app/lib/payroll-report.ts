
import { z } from 'zod';

// Ported schemas from genkit flow
export const JobSchema = z.object({
    id: z.string(),
    title: z.string(),
    clientName: z.string(),
    quoteNumber: z.string(),
    startDate: z.string(),
    deadline: z.string(),
    payout: z.number(),
    notes: z.string().optional(),
});

export const PayrollReportInputSchema = z.object({
    jobs: z.array(JobSchema),
    currentDate: z.string(),
    weekNumber: z.number(),
    startDate: z.string(),
    endDate: z.string(),
    businessName: z.string().optional(),
    businessLogoUrl: z.string().optional(),
    totalPayout: z.number(),
});

export const PayrollReportOutputSchema = z.object({
    subject: z.string(),
    body: z.string(),
});

export type PayrollReportInput = z.infer<typeof PayrollReportInputSchema>;
export type PayrollReportOutput = z.infer<typeof PayrollReportOutputSchema>;

export async function generatePayrollReport(input: PayrollReportInput): Promise<PayrollReportOutput> {
    const subject = `${input.businessName ? input.businessName + ': ' : ''}Weekly Payroll Report - Week ${input.weekNumber}`;

    const jobsHtml = input.jobs.map(job => `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #eeeeee; border-radius: 6px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 15px;">
          <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #333333;">${job.title}</p>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555;"><strong>Client:</strong> ${job.clientName}</td></tr>
            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555;"><strong>Start Date:</strong> ${job.startDate}</td></tr>
            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555;"><strong>Conclusion Date:</strong> ${job.deadline}</td></tr>
            <tr><td style="padding: 4px 0; font-size: 14px; color: #555555;"><strong>Payout:</strong> <span style="font-weight: bold; color: #1a73e8;">$${job.payout.toFixed(2)}</span></td></tr>
            ${job.notes ? `<tr><td style="padding: 8px 0 0 0; font-size: 14px; color: #555555;"><strong>Notes:</strong><br>${job.notes}</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
  `).join('');

    const body = `
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
                    ${input.businessLogoUrl ? `
                    <td align="left" style="width: 80px;">
                      <img src="${input.businessLogoUrl}" alt="${input.businessName || 'Business'} Logo" width="60" height="60" style="border-radius: 50%;">
                    </td>` : ''}
                    <td align="left" style="font-size: 24px; font-weight: bold; color: #333333;">
                      ${input.businessName || 'Weekly Report'}
                    </td>
                    <td align="right" style="font-size: 14px; color: #777777;">
                      Week ${input.weekNumber}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Intro -->
            <tr>
              <td style="padding: 20px;">
                <p style="font-size: 16px; color: #555555; line-height: 1.6; margin: 0;">
                  Here are the jobs with Open Payment status for the period from <strong>${input.startDate}</strong> to <strong>${input.endDate}</strong>:
                </p>
              </td>
            </tr>
            <!-- Jobs List -->
            <tr>
              <td>
                ${jobsHtml}
              </td>
            </tr>
            <!-- Total -->
            <tr>
              <td align="right" style="padding-top: 20px; border-top: 1px solid #dddddd;">
                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size: 16px; color: #555555;">Total Payout:</td>
                    <td style="font-size: 20px; font-weight: bold; color: #333333; padding-left: 15px;">$${input.totalPayout.toFixed(2)}</td>
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
  `;

    return { subject, body };
}
