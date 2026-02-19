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
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb; }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo-box { display: inline-block; background: #f97316; color: white; font-weight: bold; font-size: 18px; padding: 8px 16px; border-radius: 8px; }
    h1 { color: #111827; font-size: 22px; margin: 0 0 16px; }
    p { color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 12px; }
    .btn { display: inline-block; background: #f97316; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .footer { text-align: center; margin-top: 24px; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo"><span class="logo-box">Agentic Tribe</span></div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Agentic Tribe — Artificial Intelligence Community</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Welcome Email ──────────────────────────────────────────────────────────

export function welcomeEmail(params: { name?: string; email: string }) {
  const greeting = params.name ? `Hello, ${params.name}!` : 'Hello!';
  return {
    subject: 'Welcome to Agentic Tribe! 🎉',
    html: wrap(`
      <h1>${greeting}</h1>
      <p>We're glad you joined Agentic Tribe — the artificial intelligence community.</p>
      <p>Here you can:</p>
      <ul style="color: #4b5563; font-size: 15px; line-height: 1.8;">
        <li>Participate in community discussions</li>
        <li>Take courses on AI and automation</li>
        <li>Connect with like-minded people</li>
      </ul>
      <a href="${BASE_URL}/community" class="btn">Go to Community</a>
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
      <h1>${greeting}</h1>
      <p>Your paid plan has been activated successfully.</p>
      <p>You now have full access to:</p>
      <ul style="color: #4b5563; font-size: 15px; line-height: 1.8;">
        <li>Create posts</li>
        <li>Access all courses</li>
        <li>Like posts and comments</li>
        <li>Participate in the leaderboard</li>
      </ul>
      <a href="${BASE_URL}/community" class="btn">Get Started</a>
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
      <h1>Continue reading on Agentic Tribe</h1>
      <p>Click the button below to access the full article. This link expires in 15 minutes.</p>
      <a href="${magicUrl}" class="btn">Open Article</a>
      <p style="font-size: 13px; color: #9ca3af; margin-top: 24px;">If you didn't request this link, you can safely ignore this email.</p>
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
      <h1>${greeting}</h1>
      <p>Your subscription has been cancelled.</p>
      <p>${periodInfo}</p>
      <p>After that, you will automatically be switched to the free plan.</p>
      <p>If you change your mind, you can reactivate your subscription at any time.</p>
      <a href="${BASE_URL}/settings/billing" class="btn">Billing Settings</a>
    `),
    text: `${greeting}\n\nYour subscription has been cancelled.\n${periodInfo}\n\n${BASE_URL}/settings/billing`,
  };
}
