import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { name: 'Alice Chen', email: 'alice@example.com', password },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { name: 'Bob Smith', email: 'bob@example.com', password },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: { name: 'Carol Lee', email: 'carol@example.com', password },
  });

  const group = await prisma.group.create({
    data: {
      name: 'Apartment 4B',
      description: 'Monthly shared expenses for the apartment',
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: carol.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Groceries - Whole Foods',
      amount: 87.5,
      paidById: alice.id,
      groupId: group.id,
      splits: {
        create: [
          { userId: alice.id, amount: 29.17 },
          { userId: bob.id, amount: 29.17 },
          { userId: carol.id, amount: 29.16 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      description: 'Internet Bill',
      amount: 60,
      paidById: bob.id,
      groupId: group.id,
      splits: {
        create: [
          { userId: alice.id, amount: 20 },
          { userId: bob.id, amount: 20 },
          { userId: carol.id, amount: 20 },
        ],
      },
    },
  });

  console.log('Seeded users: alice@example.com / bob@example.com / carol@example.com');
  console.log('Password for all: password123');
  console.log('Seeded group: Apartment 4B with 2 sample expenses');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
