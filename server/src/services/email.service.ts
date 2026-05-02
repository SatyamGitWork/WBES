import { Resend } from 'resend';
import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Create transporter dynamically to always use fresh env values
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // Use TLS (not SSL)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@wbes.com';
  const fromLabel = 'WBES';

  // 1. Try Resend first
  if (resend) {
    try {
      const data = await resend.emails.send({
        from: `${fromLabel} <${fromEmail}>`,
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

  // 2. Fallback to Nodemailer SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      console.log('📧 Attempting to send via Nodemailer to:', process.env.SMTP_HOST);
      const transporter = createTransporter();
      const info = await transporter.sendMail({
        from: `"${fromLabel}" <${fromEmail}>`,
        to,
        subject,
        html,
      });
      console.log('✅ Email sent via Nodemailer:', info.messageId);
      return { success: true, provider: 'nodemailer', data: info };
    } catch (error) {
      console.error('❌ Nodemailer also failed:', error);
    }
  } else {
    console.warn('⚠️ SMTP credentials not configured:', {
      host: process.env.SMTP_HOST,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? '***' : 'NOT SET',
    });
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
