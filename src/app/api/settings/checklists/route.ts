
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, items, clientId, isGlobal, instructions } = body

    const template = await prisma.checklistTemplate.create({
      data: {
        name,
        items, // Json array
        instructions, // NEW field
        isGlobal: isGlobal || false,
        clientId: clientId || null
      }
    })
    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // If client user, get Global + Their Client's
    // If Super Admin, get all
    
    // For now simple fetch
    const templates = await prisma.checklistTemplate.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            client: { select: { name: true } }
        }
    })
    return NextResponse.json(templates)
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, name, items, clientId, isGlobal, instructions } = body

        const template = await prisma.checklistTemplate.update({
            where: { id },
            data: {
                name,
                items,
                instructions,
                isGlobal,
                clientId: isGlobal ? null : clientId
            }
        })
        return NextResponse.json(template)
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    try {
        await prisma.checklistTemplate.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
}
