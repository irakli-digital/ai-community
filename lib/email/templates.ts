/**
 * Georgian email templates for AI წრე.
 * Returns { subject, html, text } for each template.
 */

const BASE_URL = process.env.BASE_URL || 'https://aiwre.ge';

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Noto Sans Georgian', Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
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
      <div class="logo"><span class="logo-box">AI წრე</span></div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} AI წრე — ხელოვნური ინტელექტის საზოგადოება</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Welcome Email ──────────────────────────────────────────────────────────

export function welcomeEmail(params: { name?: string; email: string }) {
  const greeting = params.name ? `გამარჯობა, ${params.name}!` : 'გამარჯობა!';
  return {
    subject: 'კეთილი იყოს თქვენი მობრძანება AI წრე-ში! 🎉',
    html: wrap(`
      <h1>${greeting}</h1>
      <p>მოხარული ვართ, რომ შემოუერთდით AI წრეს — ხელოვნური ინტელექტის საზოგადოებას.</p>
      <p>აქ შეგიძლიათ:</p>
      <ul style="color: #4b5563; font-size: 15px; line-height: 1.8;">
        <li>მიიღოთ მონაწილეობა თემის დისკუსიებში</li>
        <li>გაიაროთ კურსები AI და ავტომატიზაციის შესახებ</li>
        <li>დაუკავშირდეთ მსგავსი ინტერესების მქონე ადამიანებს</li>
      </ul>
      <a href="${BASE_URL}/community" class="btn">გადავიდეთ თემზე</a>
    `),
    text: `${greeting}\n\nმოხარული ვართ, რომ შემოუერთდით AI წრეს.\n\nეწვიეთ: ${BASE_URL}/community`,
  };
}

// ─── Subscription Confirmation ──────────────────────────────────────────────

export function subscriptionConfirmationEmail(params: { name?: string }) {
  const greeting = params.name ? `გამარჯობა, ${params.name}!` : 'გამარჯობა!';
  return {
    subject: 'გამოწერა წარმატებით გააქტიურდა! ✅',
    html: wrap(`
      <h1>${greeting}</h1>
      <p>თქვენი ფასიანი გეგმა წარმატებით გააქტიურდა.</p>
      <p>ახლა თქვენ გაქვთ სრული წვდომა:</p>
      <ul style="color: #4b5563; font-size: 15px; line-height: 1.8;">
        <li>პოსტების შექმნა</li>
        <li>ყველა კურსზე წვდომა</li>
        <li>პოსტების და კომენტარების მოწონება</li>
        <li>ლიდერბორდში მონაწილეობა</li>
      </ul>
      <a href="${BASE_URL}/community" class="btn">დავიწყოთ</a>
    `),
    text: `${greeting}\n\nთქვენი ფასიანი გეგმა წარმატებით გააქტიურდა.\n\n${BASE_URL}/community`,
  };
}

// ─── Subscription Cancellation ──────────────────────────────────────────────

export function subscriptionCancellationEmail(params: {
  name?: string;
  periodEnd?: string;
}) {
  const greeting = params.name ? `გამარჯობა, ${params.name}!` : 'გამარჯობა!';
  const periodInfo = params.periodEnd
    ? `თქვენი წვდომა გაგრძელდება ${params.periodEnd}-მდე.`
    : 'თქვენი წვდომა გაგრძელდება მიმდინარე ბილინგის პერიოდის ბოლომდე.';

  return {
    subject: 'გამოწერა გაუქმებულია',
    html: wrap(`
      <h1>${greeting}</h1>
      <p>თქვენი გამოწერა გაუქმდა.</p>
      <p>${periodInfo}</p>
      <p>ამის შემდეგ თქვენ ავტომატურად გადახვალთ უფასო გეგმაზე.</p>
      <p>თუ გადაიფიქრეთ, ნებისმიერ დროს შეგიძლიათ ხელახლა გააქტიუროთ გამოწერა.</p>
      <a href="${BASE_URL}/settings/billing" class="btn">ბილინგის პარამეტრები</a>
    `),
    text: `${greeting}\n\nთქვენი გამოწერა გაუქმდა.\n${periodInfo}\n\n${BASE_URL}/settings/billing`,
  };
}
