# E2E Test Plan — AI წრე (AI Circle)

## Framework
- **Playwright** with TypeScript
- Manual runs: `npx playwright test`
- No CI — run locally before commits

## Test Data Strategy
- Fresh test DB seeded before each suite
- 3 test users: admin (first signup), paid member, free member
- Stripe skipped — subscription status set directly in DB for test users

## Folder Structure
```
e2e/
├── fixtures/
│   ├── auth.ts          # Login helpers, test user creation
│   ├── db.ts            # DB seed/cleanup helpers
│   └── test-data.ts     # Reusable test content (posts, courses, etc.)
├── auth.spec.ts
├── community-feed.spec.ts
├── gamification.spec.ts
├── classroom.spec.ts
├── notifications.spec.ts
├── search.spec.ts
├── admin.spec.ts
├── member-profiles.spec.ts
└── landing.spec.ts
```

---

## Test Suites

### 1. Auth (`auth.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| 1.1 | Sign up first user | User created with admin role |
| 1.2 | Sign up second user | User created with member role |
| 1.3 | Sign in with valid credentials | Redirected to /community |
| 1.4 | Sign in with wrong password | Error shown in Georgian |
| 1.5 | Sign out | Redirected to landing page |
| 1.6 | Access /community without auth | Redirected to /sign-in |
| 1.7 | Access /admin as non-admin | Blocked / redirected |
| 1.8 | Access /admin as admin | Page loads |

### 2. Community Feed (`community-feed.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| 2.1 | Free user views feed | Posts visible, no create button |
| 2.2 | Free user can comment | Comment form visible, submits successfully |
| 2.3 | Free user cannot like | Like button disabled or hidden |
| 2.4 | Free user cannot create post | Create button hidden / route blocked |
| 2.5 | Paid user creates text post | Post appears in feed |
| 2.6 | Paid user creates post with image | Image uploads and displays |
| 2.7 | Paid user creates post with link | OG metadata fetched and displayed |
| 2.8 | Paid user likes a post | Like count increments |
| 2.9 | Paid user unlikes a post | Like count decrements |
| 2.10 | Paid user comments on post | Comment appears, comment count updates |
| 2.11 | Paid user replies to comment | Reply appears nested under parent |
| 2.12 | Author deletes own post | Post removed from feed |
| 2.13 | Category filter shows correct posts | Only posts in selected category |
| 2.14 | Infinite scroll loads more posts | Additional posts load on scroll |
| 2.15 | Admin pins post | Post appears at top of feed |
| 2.16 | Admin unpins post | Post returns to chronological position |
| 2.17 | Admin/mod deletes any post | Post removed |
| 2.18 | Markdown renders in post content | Bold, links, lists render correctly |

### 3. Gamification (`gamification.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| 3.1 | Like a post → author gets +1 point | Points increment in DB |
| 3.2 | Unlike a post → author gets -1 point | Points decrement |
| 3.3 | Like a comment → author gets +1 point | Points increment |
| 3.4 | Points never go below 0 | Floor at 0 |
| 3.5 | User reaches level 2 at 10 points | Level updates automatically |
| 3.6 | Leaderboard 7-day tab | Shows points from last 7 days only |
| 3.7 | Leaderboard 30-day tab | Shows points from last 30 days |
| 3.8 | Leaderboard all-time tab | Shows total points |
| 3.9 | Level badge displays on profile | Correct level shown |

### 4. Member Profiles (`member-profiles.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| 4.1 | Edit profile (name, bio, location) | Changes saved and visible |
| 4.2 | Upload avatar | Avatar displays on profile and cards |
| 4.3 | Member directory shows all members | Grid renders with correct info |
| 4.4 | Search members by name | Filtered results |
| 4.5 | Filter members by level | Correct filtering |
| 4.6 | Online indicator (green dot) | Shows for recently active users |
| 4.7 | View another member's profile | Profile page loads with posts |

### 5. Classroom (`classroom.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| 5.1 | Admin creates a course | Course appears in listing |
| 5.2 | Admin adds sections and lessons | Sidebar shows structure |
| 5.3 | Admin adds video URL to lesson | Video embed renders |
| 5.4 | Admin publishes course | Course visible to members |
| 5.5 | Free user can't access paid course | Upgrade prompt shown |
| 5.6 | Paid user accesses paid course | Course content loads |
| 5.7 | Mark lesson complete (manual) | Checkmark appears, progress updates |
| 5.8 | Auto-mark on scroll to bottom | Lesson marked as viewed |
| 5.9 | Progress bar shows correct % | Completed/total accurate |
| 5.10 | Free course accessible to all | No lock badge, content loads |
| 5.11 | Lesson attachments downloadable | Download works for paid users |

### 6. Notifications (`notifications.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| 6.1 | Like triggers notification | Notification appears for post author |
| 6.2 | Comment triggers notification | Notification for post author |
| 6.3 | Reply triggers notification | Notification for comment author |
| 6.4 | Level-up triggers notification | "You reached level X" notification |
| 6.5 | Bell icon shows unread count | Badge number matches unread |
| 6.6 | Mark notification as read | Badge decrements |
| 6.7 | Mark all as read | Badge clears |
| 6.8 | Notification batching | 5 likes in 15min = 1 notification |

### 7. Search (`search.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| 7.1 | Search posts by keyword | Matching posts returned |
| 7.2 | Search courses by title | Matching courses returned |
| 7.3 | Search members by name | Matching members returned |
| 7.4 | Cmd+K opens search modal | Modal opens |
| 7.5 | Empty search shows no results | Empty state in Georgian |
| 7.6 | Georgian text search works | Results returned for Georgian queries |

### 8. Admin Dashboard (`admin.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| 8.1 | Analytics page loads with data | Charts/stats render |
| 8.2 | Create category | Category available in feed filter |
| 8.3 | Edit category | Changes reflected |
| 8.4 | Delete category | Removed from filter |
| 8.5 | Reorder categories | New order persisted |
| 8.6 | Change user role | Role updated |
| 8.7 | Edit community settings | Changes reflected on landing page |
| 8.8 | Upload logo/cover image | Images display on landing |

### 9. Landing Page (`landing.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| 9.1 | Public landing loads | Community info visible |
| 9.2 | Member count shown | Correct number |
| 9.3 | Join CTA leads to signup | Navigates to /sign-up |
| 9.4 | Pricing section shows tiers | Free vs Paid visible |

---

## Run Commands

```bash
# Run all tests
npx playwright test

# Run specific suite
npx playwright test e2e/auth.spec.ts

# Run with browser visible
npx playwright test --headed

# Run specific test by name
npx playwright test -g "Free user can comment"
```

## Notes
- All UI text assertions use Georgian strings
- S3 uploads: mock with local `/tmp/uploads` in test mode
- Stripe: skip — set subscription status directly in test DB
- Tests run against `pnpm dev` (start dev server before running)
