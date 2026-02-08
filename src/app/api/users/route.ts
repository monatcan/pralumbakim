
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hash } from 'bcryptjs'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, password, fullName, role, selectedClientIds, selectedBranchIds } = body

    if (!email || !password || !fullName || !role) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
        clients: selectedClientIds?.length > 0 ? {
            connect: selectedClientIds.map((id: string) => ({ id }))
        } : undefined,
        assignedBranches: selectedBranchIds?.length > 0 ? {
            connect: selectedBranchIds.map((id: string) => ({ id }))
        } : undefined
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Error creating user' }, { status: 500 })
  }
}

export async function GET() {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  
    const users = await prisma.user.findMany({
      include: {
        clients: true,
        assignedBranches: true
      },
      orderBy: { createdAt: 'desc' }
    })
  
    return NextResponse.json(users)
}
