import 'dotenv/config'
import { Role } from '@prisma/client'
import { hash } from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const password = await hash('admin123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'admin@bakim.com' },
    update: {},
    create: {
      email: 'admin@bakim.com',
      fullName: 'Süper Admin',
      password,
      role: Role.SUPER_ADMIN,
    },
  })
  console.log({ user })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
