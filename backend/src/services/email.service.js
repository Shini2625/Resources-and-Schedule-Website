import nodemailer from 'nodemailer';

const frontendOrigin = () => (process.env.FRONTEND_URL || process.env.CLIENT_URL || '').trim().replace(/\/+$/, '');

const isValidFrontendOrigin = () => {
  try {
    const origin = frontendOrigin();
    const parsed = new URL(origin);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.origin === origin;
  } catch {
    return false;
  }
};

export const isPasswordResetEmailConfigured = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  return Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_USER
    && process.env.SMTP_PASS
    && process.env.EMAIL_FROM
    && Number.isInteger(port)
    && port > 0
    && port < 65536
    && isValidFrontendOrigin()
  );
};

export const buildPasswordResetUrl = (token) => {
  const origin = frontendOrigin();
  if (!origin) throw new Error('FRONTEND_URL is not configured.');
  const url = new URL('/', origin);
  url.searchParams.set('resetToken', token);
  return url.toString();
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const port = Number(process.env.SMTP_PORT || 587);
  const configuredFrom = String(process.env.EMAIL_FROM || '').trim();
  const senderAddress = configuredFrom.match(/<([^<>]+)>/)?.[1]?.trim() || configuredFrom;
  const safeResetUrl = resetUrl.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter.sendMail({
    from: { name: 'Jacker', address: senderAddress },
    to,
    subject: 'Reset your Jacker password',
    text: [
      'We received a request to reset your Jacker password.',
      '',
      `Use this link within 15 minutes: ${resetUrl}`,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;color:#20352a;line-height:1.6;max-width:560px;margin:auto"><h1 style="color:#123e32">Reset your Jacker password</h1><p>We received a request to reset the password for your Jacker account.</p><p><a href="${safeResetUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#123e32;color:#fff;text-decoration:none">Choose a new password</a></p><p>This link expires in 15 minutes and can only be used once.</p><p>If you did not request this, you can ignore this email.</p></div>`,
  });
};
