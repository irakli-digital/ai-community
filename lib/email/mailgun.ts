/**
 * Mailgun email wrapper.
 * Fire-and-forget: errors are logged but don't throw.
 * Uses the Mailgun REST API directly (no SDK dependency).
 */

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const MAILGUN_FROM = process.env.MAILGUN_FROM || `AI წრე <noreply@${MAILGUN_DOMAIN}>`;

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.warn('[Email] Mailgun not configured, skipping email send.');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('from', MAILGUN_FROM);
    formData.append('to', params.to);
    formData.append('subject', params.subject);
    formData.append('html', params.html);
    if (params.text) {
      formData.append('text', params.text);
    }

    const response = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Email] Mailgun error:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

/**
 * Fire-and-forget email send (doesn't block the calling action).
 */
export function sendEmailAsync(params: EmailParams): void {
  sendEmail(params).catch((err) => {
    console.error('[Email] Async email failed:', err);
  });
}
