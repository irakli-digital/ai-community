# AI წრე (Agentic Tribe)

ქართული AI/ტექნოლოგიური საზოგადოების პლატფორმა — Skool.com-ის სტილში აშენებული, Next.js 15-ზე.

## ფუნქციები

- **საზოგადოების ფიდი** — პოსტები, კომენტარები, მოწონებები, კატეგორიების ფილტრი
- **კლასრუმი** — კურსები სექციებითა და გაკვეთილებით, ვიდეო ჩაშენება, პროგრესის ტრეკინგი
- **გეიმიფიკაცია** — ქულები, დონეები (1-9), ლიდერბორდი
- **წევრების დირექტორია** — პროფილები, ონლაინ სტატუსი
- **შეტყობინებები** — ინ-აპ + ელფოსტა (Mailgun)
- **გლობალური ძიება** — PostgreSQL full-text search
- **ადმინ პანელი** — ანალიტიკა, კონტენტის მართვა, წევრების მართვა
- **ფრემიუმ მოდელი** — Stripe-ით, GEL ვალუტა

## ტექ სტეკი

| კომპონენტი | ტექნოლოგია |
|---|---|
| ფრეიმვორკი | Next.js 15 (App Router, Server Actions) |
| ენა | TypeScript |
| სტილი | Tailwind CSS 4 |
| UI კომპონენტები | shadcn/ui (Radix UI) |
| ბაზა | PostgreSQL (Drizzle ORM) |
| ავთენტიფიკაცია | JWT (httpOnly cookies) |
| გადახდები | Stripe |
| ფაილების შენახვა | AWS S3 (presigned uploads) |
| ელფოსტა | Mailgun |
| ფონტი | Noto Sans Georgian |
| დეპლოი | Railway.com (Docker) |

## ლოკალური სეტაპი

### წინაპირობები

- Node.js 20+
- pnpm
- PostgreSQL ბაზა

### ინსტალაცია

```bash
# კლონირება
git clone <repo-url>
cd saas-starter

# დამოკიდებულებების ინსტალაცია
pnpm install

# გარემოს ცვლადები
cp .env.example .env
# შეავსეთ .env ფაილი (იხ. ქვემოთ)

# ბაზის სეტაპი
pnpm db:setup
pnpm db:migrate

# (ოფციონალური) ტესტ მონაცემები
pnpm db:seed

# დეველოპმენტ სერვერი
pnpm dev
```

აპლიკაცია ხელმისაწვდომი იქნება: http://localhost:3000

### პირველი მომხმარებელი = ადმინი

პირველი დარეგისტრირებული მომხმარებელი ავტომატურად ხდება ადმინი.

## გარემოს ცვლადები

```env
# ─── აუცილებელი ─────────────────────────────────
POSTGRES_URL=postgresql://user:pass@localhost:5432/aicircle
AUTH_SECRET=your-secret-key-min-32-chars
BASE_URL=http://localhost:3000

# ─── Stripe ─────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── AWS S3 (ფაილების ატვირთვა) ─────────────────
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=eu-central-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# ─── Mailgun (ელფოსტა) ─────────────────────────
MAILGUN_API_KEY=key-...
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM=AI წრე <noreply@yourdomain.com>
```

## სკრიპტები

| ბრძანება | აღწერა |
|---|---|
| `pnpm dev` | დეველოპმენტ სერვერი (Turbopack) |
| `pnpm build` | პროდაქშენ ბილდი |
| `pnpm start` | პროდაქშენ სერვერი |
| `pnpm db:setup` | ბაზის ინიციალიზაცია |
| `pnpm db:migrate` | მიგრაციების გაშვება |
| `pnpm db:seed` | ტესტ მონაცემების ჩაწერა |
| `pnpm db:generate` | ახალი მიგრაციის გენერაცია |
| `pnpm db:studio` | Drizzle Studio (DB GUI) |
| `npx playwright test` | E2E ტესტები |

## Railway-ზე დეპლოი

### 1. Railway პროექტის შექმნა

1. შედით [railway.com](https://railway.com)-ზე
2. შექმენით ახალი პროექტი
3. დაამატეთ PostgreSQL სერვისი
4. დააკავშირეთ GitHub რეპო

### 2. გარემოს ცვლადების დაყენება

Railway Settings → Variables:

- `POSTGRES_URL` — ავტომატურად Railway PostgreSQL-იდან
- `AUTH_SECRET` — გენერირებული სეკრეტი
- `BASE_URL` — თქვენი Railway URL ან custom domain
- `STRIPE_SECRET_KEY` — Stripe live key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook secret
- `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`

### 3. Dockerfile ბილდი

Railway ავტომატურად ამოიცნობს `Dockerfile`-ს და `railway.json`-ს.

### 4. Custom Domain

Railway Settings → Domains → Add Custom Domain

### 5. Stripe Webhook

Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://yourdomain.com/api/stripe/webhook`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

## პროექტის სტრუქტურა

```
app/
├── (public)/          # ლენდინგ გვერდი
├── (auth)/            # შესვლა/რეგისტრაცია
├── (app)/             # ავთენტიფიცირებული აპი
│   ├── community/     # საზოგადოების ფიდი
│   ├── classroom/     # კურსები
│   ├── members/       # წევრების დირექტორია
│   ├── leaderboard/   # ლიდერბორდი
│   ├── notifications/ # შეტყობინებები
│   ├── search/        # ძიება
│   ├── settings/      # პარამეტრები
│   └── admin/         # ადმინ პანელი
├── api/               # API routes
└── layout.tsx         # root layout

components/
├── ui/                # shadcn/ui
├── community/         # პოსტი, კომენტარი, კატეგორია
├── classroom/         # კურსი, გაკვეთილი
├── members/           # წევრის ბარათი, ბეჯი
├── layout/            # ჰედერი, საიდბარი
├── notifications/     # შეტყობინებების ზარი
├── search/            # ძიების მოდალი
└── shared/            # საერთო კომპონენტები

lib/
├── auth/              # JWT, მიდლვეარი
├── db/                # Drizzle სქემა, კვერიები
├── i18n/              # ქართული თარგმანები
├── payments/          # Stripe ინტეგრაცია
├── storage/           # S3 ინტეგრაცია
├── email/             # Mailgun ინტეგრაცია
├── gamification.ts    # ქულები, დონეები
└── notifications.ts   # შეტყობინებების ლოგიკა
```

## ლიცენზია

Private — ყველა უფლება დაცულია.
