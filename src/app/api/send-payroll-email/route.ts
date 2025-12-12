import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            contractorEmail,
            userEmail,
            weekNumber,
            year,
            startDate,
            endDate,
            totalPayout,
            jobCount,
            businessName
        } = body;

        // Validate required fields
        if (!contractorEmail || !userEmail) {
            return NextResponse.json(
                { error: 'Missing required email addresses' },
                { status: 400 }
            );
        }

        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: `${businessName || 'PaintFlow'} <onboarding@resend.dev>`,
            to: contractorEmail,
            cc: userEmail,
            subject: `Payroll Report - Week ${weekNumber}, ${year}`,
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #4F46E5;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background-color: #f9fafb;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-label {
                font-weight: bold;
                color: #6b7280;
              }
              .info-value {
                color: #111827;
              }
              .total {
                font-size: 24px;
                font-weight: bold;
                color: #4F46E5;
                text-align: center;
                padding: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                padding: 20px 0;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Payroll Report</h1>
              <p>Week ${weekNumber}, ${year}</p>
            </div>
            <div class="content">
              <p>Hi,</p>
              <p>Please find your payroll report for the period below:</p>
              
              <div class="info-row">
                <span class="info-label">Period:</span>
                <span class="info-value">${startDate} - ${endDate}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Total Jobs:</span>
                <span class="info-value">${jobCount}</span>
              </div>
              
              <div class="total">
                Total Payout: $${totalPayout.toLocaleString()}
              </div>
              
              <p>Best regards,<br>${businessName || 'PaintFlow Team'}</p>
            </div>
            <div class="footer">
              <p>This is an automated email from ${businessName || 'PaintFlow'}.</p>
            </div>
          </body>
        </html>
      `,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json(
                { error: 'Failed to send email', details: error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            messageId: data?.id
        });

    } catch (error) {
        console.error('Email API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
