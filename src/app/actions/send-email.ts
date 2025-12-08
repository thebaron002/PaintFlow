
'use server';

import { Resend } from 'resend';

interface State {
  error: string | null;
  success: boolean;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
    prevState: State,
    formData: FormData,
): Promise<State> {
    const to = formData.getAll('to') as string[];
    const subject = formData.get('subject') as string;
    const html = formData.get('html') as string;
    const from = 'onboarding@resend.dev';

    try {
        await resend.emails.send({
            from,
            to,
            subject,
            html,
        });

        return {
            error: null,
            success: true,
        };
    } catch (error) {
        console.error('Email sending error:', error);
        return {
            error: (error as Error).message,
            success: false,
        };
    }
}
