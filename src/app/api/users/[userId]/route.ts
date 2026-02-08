import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hash } from 'bcryptjs'

export async function PUT(
  request: Request,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId } = params
    const body = await request.json()
    const { email, password, fullName, role, selectedClientIds, selectedBranchIds } = body

    if (!email || !fullName || !role) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const updateData: any = {
        email,
        fullName,
        role,
        clients: {
            set: [], // Dissociate all first
            connect: selectedClientIds.map((id: string) => ({ id }))
        },
        assignedBranches: {
            set: [], // Dissociate all first
            connect: selectedBranchIds.map((id: string) => ({ id }))
        }
    }

    if (password && password.trim() !== '') {
        updateData.password = await hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 })
  }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ userId: string }> }
  ) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  
    try {
      const { userId } = params
      
      // Check if user has related records if necessary, but Prisma might have cascading deletes or throw error
      // Ideally we check before deleting, but keeping it simple for now
      await prisma.user.delete({
        where: { id: userId }
      })
  
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: 'Error deleting user' }, { status: 500 })
    }
  }
