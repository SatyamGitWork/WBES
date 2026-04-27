import { Resend } from 'resend';
import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
  const fromEmail = 'noreply@exampro.com'; // Change this in production

  // 1. Try Resend first
  if (resend) {
    try {
      const data = await resend.emails.send({
        from: `ExamPro <${fromEmail}>`,
        to,
        subject,
        html,
      });
      console.log('✅ Email sent via Resend:', data.id);
      return { success: true, provider: 'resend', data };
    } catch (error) {
      console.warn('⚠️ Resend failed, falling back to Nodemailer:', error);
    }
  }

  // 2. Fallback to Nodemailer
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const info = await transporter.sendMail({
        from: `"ExamPro" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      console.log('✅ Email sent via Nodemailer:', info.messageId);
      return { success: true, provider: 'nodemailer', data: info };
    } catch (error) {
      console.error('❌ Nodemailer also failed:', error);
    }
  }

  // 3. Dev mode stub
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📧 --- STUB EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html.replace(/<[^>]*>?/gm, '')}`); // Strip HTML for console readability
    console.log('----------------------\n');
    return { success: true, provider: 'console', data: null };
  }

  throw new Error('All email providers failed or are not configured');
};
