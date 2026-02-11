import 'dotenv/config';
import { db } from './drizzle';
import { users } from './schema';
import { hash } from 'bcryptjs';

const georgianFirstNames = [
  'ნიკა', 'გიორგი', 'დავით', 'ალექსანდრე', 'ლუკა', 'ილია', 'მარიამ', 'ანა',
  'თამარ', 'ნინო', 'ელენე', 'სალომე', 'ბარბარე', 'ეკატერინე', 'მაია',
  'სოფიკო', 'ნათია', 'თეო', 'კახა', 'ზურაბ', 'ლევან', 'ბექა', 'გუგა',
  'რატი', 'ტატო', 'ირაკლი', 'შოთა', 'მიხეილ', 'ვახო', 'ბიძინა',
  'თინა', 'ხატია', 'მეგი', 'ლიკა', 'ქეთი', 'დარეჯან', 'მანანა', 'ნანა',
  'ციცო', 'ჟუჟუნა', 'ნუნუ', 'თეა', 'ლია', 'ეთერ', 'დალი', 'რუსუდან',
  'ნატა', 'სოფო', 'ნინი', 'მაკა', 'ტატია', 'ანუკი', 'თათია', 'ლანა',
  'ნუცა', 'ჯაბა', 'გოჩა', 'ოთარ', 'ნოდარ', 'რევაზ',
];

const georgianLastNames = [
  'ბერიძე', 'კაპანაძე', 'გელაშვილი', 'მაისურაძე', 'ლომიძე',
  'ჭანტურია', 'თოფურია', 'ხარაიშვილი', 'ჩხეიძე', 'წერეთელი',
  'ჯავახიშვილი', 'დავითაშვილი', 'მეტრეველი', 'ნიკოლაიშვილი', 'ქურდაძე',
  'გოგიჩაიშვილი', 'კვარაცხელია', 'ბურჯანაძე', 'მიქელაძე', 'ხვიჩია',
  'შენგელია', 'ტაბიძე', 'გორგოძე', 'ჩიქოვანი', 'ლობჟანიძე',
  'სულაკაური', 'კობახიძე', 'ხალვაში', 'ნოზაძე', 'დუმბაძე',
  'ქუთათელაძე', 'ნარიმანიძე', 'ფხაკაძე', 'ციხისელი', 'ორმოცაძე',
  'ბაღდავაძე', 'ყაჯაია', 'მუსხელიშვილი', 'ბედიანიშვილი', 'ჩიხლაძე',
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function levelFromPoints(points: number): number {
  if (points >= 100) return 5;
  if (points >= 50) return 4;
  if (points >= 25) return 3;
  if (points >= 10) return 2;
  return 1;
}

async function main() {
  console.log('Seeding mock users...');

  const passwordHash = await hash('member123', 10);
  const mockUsers: Array<{
    name: string;
    email: string;
    passwordHash: string;
    role: 'member';
    points: number;
    level: number;
  }> = [];

  const usedEmails = new Set<string>();

  for (let i = 0; i < 120; i++) {
    const firstName = randomPick(georgianFirstNames);
    const lastName = randomPick(georgianLastNames);
    const name = `${firstName} ${lastName}`;

    // Generate unique email
    let email: string;
    let counter = 0;
    do {
      const suffix = counter > 0 ? counter.toString() : '';
      email = `mock.user${i + 1}${suffix}@agentic-tribe.ge`;
      counter++;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    const points = randomInt(0, 50);
    const level = levelFromPoints(points);

    mockUsers.push({
      name,
      email,
      passwordHash,
      role: 'member',
      points,
      level,
    });
  }

  // Insert with onConflictDoNothing for idempotency
  const result = await db
    .insert(users)
    .values(mockUsers)
    .onConflictDoNothing({ target: users.email });

  console.log(`Inserted mock users (skipping duplicates). Done!`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
