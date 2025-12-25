import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

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
      businessName,
      customSubject,
      customHtml,
      additionalCc
    } = body;

    console.log('Sending email with body:', body);

    // Verify environment variables are present
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('SERVER ERROR: Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env');
      return NextResponse.json(
        { error: 'Email configuration missing on server (.env)' },
        { status: 500 }
      );
    }

    // Gmail SMTP Configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      debug: true,
      logger: true
    });

    const subject = customSubject || `Payroll Report - Week ${weekNumber}, ${year}`;
    const htmlContent = customHtml || `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .info-label { font-weight: bold; color: #6b7280; }
              .total { font-size: 24px; font-weight: bold; color: #4F46E5; text-align: center; padding: 20px 0; }
              .footer { text-align: center; color: #6b7280; padding: 20px 0; font-size: 14px; }
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
              <div class="info-row"><span class="info-label">Period:</span><span>${startDate} - ${endDate}</span></div>
              <div class="info-row"><span class="info-label">Total Jobs:</span><span>${jobCount}</span></div>
              <div class="total">Total Payout: $${totalPayout?.toLocaleString()}</div>
              <p>Best regards,<br>${businessName || 'PaintFlow Team'}</p>
            </div>
          </body>
        </html>
    `;

    // Prepare CC array
    const ccList = [userEmail];
    if (additionalCc) {
      ccList.push(additionalCc);
    }

    // Send email using Nodemailer
    const info = await transporter.sendMail({
      from: `"${businessName || 'PaintFlow'}" <${process.env.GMAIL_USER}>`,
      replyTo: userEmail,
      to: contractorEmail,
      cc: ccList,
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId
    });

  } catch (error: any) {
    console.error('Nodemailer Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
