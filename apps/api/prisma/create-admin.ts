/**
 * Создаёт или обновляет пользователя с ролью ADMIN.
 * Запуск:  ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_FIRSTNAME=... tsx prisma/create-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const firstName = process.env.ADMIN_FIRSTNAME ?? null;
  const lastName = process.env.ADMIN_LASTNAME ?? null;

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars.');
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
    },
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
      firstName,
      lastName,
      cart: { create: {} },
    },
    select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true },
  });

  console.log('✅ Admin user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
