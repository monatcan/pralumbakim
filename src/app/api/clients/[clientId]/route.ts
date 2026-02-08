import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow SUPER_ADMIN and PROJECT_MANAGER (subject to checks)
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PROJECT_MANAGER') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
     // If PROJECT_MANAGER, verify they have access to this client
     if (session.user.role === 'PROJECT_MANAGER') {
         const user = await prisma.user.findUnique({
             where: { id: session.user.id },
             include: { clients: true }
         });
         const hasAccess = user?.clients.some(c => c.id === clientId);
         if (!hasAccess) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
         }
     }

    const client = await prisma.client.findUnique({
      where: {
        id: clientId
      },
      include: {
        _count: {
          select: { branches: true, users: true }
        }
      }
    })

    if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching client' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check Permissions
  let authorized = false;
  if (session.user.role === 'SUPER_ADMIN') {
      authorized = true;
  } else if (session.user.role === 'PROJECT_MANAGER') {
      // Check if user is assigned to this client
      const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { clients: true }
      });
      if (user?.clients.some(c => c.id === clientId)) {
          authorized = true;
      }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, logo } = body

    const updateData: any = {}
    if (name) updateData.name = name
    // Allow null to remove logo, or string to update it
    if (logo !== undefined) updateData.logo = logo 

    const client = await prisma.client.update({
      where: { id: clientId },
      data: updateData
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: 'Error updating client' }, { status: 500 })
  }
}
