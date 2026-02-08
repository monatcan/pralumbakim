import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow SUPER_ADMIN and PROJECT_MANAGER
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PROJECT_MANAGER') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const includeBranches = searchParams.get('includeBranches') === 'true'

  let whereClause = {};

  // If PROJECT_MANAGER, only show their attached clients
  if (session.user.role === 'PROJECT_MANAGER') {
     const userWithClients = await prisma.user.findUnique({
         where: { id: session.user.id },
         include: { clients: true }
     });
     
     if (!userWithClients || userWithClients.clients.length === 0) {
         return NextResponse.json([]); // No clients assigned
     }

     const clientIds = userWithClients.clients.map(c => c.id);
     whereClause = { id: { in: clientIds } };
  }

  const clients = await prisma.client.findMany({
    where: whereClause,
    include: {
      branches: includeBranches,
      _count: {
        select: { branches: true, users: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, logo } = body

    const client = await prisma.client.create({
      data: {
        name,
        logo
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating client' }, { status: 500 })
  }
}
