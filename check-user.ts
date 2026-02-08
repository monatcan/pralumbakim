// check-user.ts
import 'dotenv/config'
import { prisma } from './src/lib/prisma'
import { compare } from 'bcryptjs'

async function main() {
  const email = 'admin@bakim.com'
  const password = 'admin123'

  console.log(`Searching for user with email: ${email}`)
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log('User NOT found!')
    return
  }

  console.log('User found:', user)
  console.log('Stored hashed password:', user.password)

  console.log(`Checking password: ${password}`)
  const isValid = await compare(password, user.password)
  console.log('Password valid:', isValid)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
