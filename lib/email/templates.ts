/**
 * Email templates for Agentic Tribe.
 * Returns { subject, html, text } for each template.
 */

const BASE_URL = process.env.BASE_URL || 'https://agentictribe.ge';

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0f0d0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0d0b;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px;">
          <a href="${BASE_URL}" style="text-decoration:none;color:#F4F0E4;font-size:20px;font-weight:700;letter-spacing:-0.3px;">
            Agentic Tribe
          </a>
        </td></tr>
        <!-- Card -->
        <tr><td style="background-color:#16130f;border:1px solid #2a2520;border-radius:16px;padding:40px 32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#6b6460;line-height:1.5;">
            &copy; ${new Date().getFullYear()} Agentic Tribe &mdash; Artificial Intelligence Community
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Welcome Email ──────────────────────────────────────────────────────────

export function welcomeEmail(params: { name?: string; email: string }) {
  const greeting = params.name ? `Hello, ${params.name}!` : 'Hello!';
  return {
    subject: 'Welcome to Agentic Tribe! 🎉',
    html: wrap(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#F4F0E4;">${greeting}</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#c4bdb4;">We're glad you joined Agentic Tribe — the artificial intelligence community.</p>
      <p style="margin:0 0 8px;font-size:15px;color:#c4bdb4;">Here you can:</p>
      <ul style="color:#c4bdb4;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li>Participate in community discussions</li>
        <li>Take courses on AI and automation</li>
        <li>Connect with like-minded people</li>
      </ul>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background-color:#c05a2c;border-radius:8px;">
        <a href="${BASE_URL}/community" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#F4F0E4;text-decoration:none;">Go to Community</a>
      </td></tr></table>
    `),
    text: `${greeting}\n\nWe're glad you joined Agentic Tribe.\n\nVisit: ${BASE_URL}/community`,
  };
}

// ─── Subscription Confirmation ──────────────────────────────────────────────

export function subscriptionConfirmationEmail(params: { name?: string }) {
  const greeting = params.name ? `Hello, ${params.name}!` : 'Hello!';
  return {
    subject: 'Subscription activated successfully! ✅',
    html: wrap(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#F4F0E4;">${greeting}</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#c4bdb4;">Your paid plan has been activated successfully.</p>
      <p style="margin:0 0 8px;font-size:15px;color:#c4bdb4;">You now have full access to:</p>
      <ul style="color:#c4bdb4;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li>Create posts</li>
        <li>Access all courses</li>
        <li>Like posts and comments</li>
        <li>Participate in the leaderboard</li>
      </ul>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background-color:#c05a2c;border-radius:8px;">
        <a href="${BASE_URL}/community" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#F4F0E4;text-decoration:none;">Get Started</a>
      </td></tr></table>
    `),
    text: `${greeting}\n\nYour paid plan has been activated successfully.\n\n${BASE_URL}/community`,
  };
}

// ─── Magic Link ─────────────────────────────────────────────────────────────

export function magicLinkEmail(params: { token: string; redirectUrl: string }) {
  const magicUrl = `${BASE_URL}/auth/magic?token=${params.token}`;
  return {
    subject: 'Your access link — Agentic Tribe',
    html: wrap(`
      <p style="margin:0 0 8px;font-size:14px;font-weight:500;color:#c05a2c;text-transform:uppercase;letter-spacing:0.5px;">Magic Link</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#F4F0E4;">Continue reading on Agentic Tribe</h1>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#c4bdb4;">Tap the button below to access the full article. This link expires in 15 minutes.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background-color:#c05a2c;border-radius:8px;">
          <a href="${magicUrl}" style="display:inline-block;padding:14px 40px;font-size:16px;font-weight:600;color:#F4F0E4;text-decoration:none;">Open Article &rarr;</a>
        </td></tr></table>
      </td></tr></table>
      <p style="margin:28px 0 0;font-size:12px;color:#6b6460;line-height:1.5;">If you didn't request this link, you can safely ignore this email.</p>
    `),
    text: `Continue reading on Agentic Tribe\n\nClick the link below to access the full article:\n${magicUrl}\n\nThis link expires in 15 minutes.`,
  };
}

// ─── Subscription Cancellation ──────────────────────────────────────────────

export function subscriptionCancellationEmail(params: {
  name?: string;
  periodEnd?: string;
}) {
  const greeting = params.name ? `Hello, ${params.name}!` : 'Hello!';
  const periodInfo = params.periodEnd
    ? `Your access will continue until ${params.periodEnd}.`
    : 'Your access will continue until the end of the current billing period.';

  return {
    subject: 'Subscription cancelled',
    html: wrap(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#F4F0E4;">${greeting}</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#c4bdb4;">Your subscription has been cancelled.</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#c4bdb4;">${periodInfo}</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#c4bdb4;">After that, you will automatically be switched to the free plan.</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#c4bdb4;">If you change your mind, you can reactivate your subscription at any time.</p>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background-color:#c05a2c;border-radius:8px;">
        <a href="${BASE_URL}/settings/billing" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#F4F0E4;text-decoration:none;">Billing Settings</a>
      </td></tr></table>
    `),
    text: `${greeting}\n\nYour subscription has been cancelled.\n${periodInfo}\n\n${BASE_URL}/settings/billing`,
  };
}
