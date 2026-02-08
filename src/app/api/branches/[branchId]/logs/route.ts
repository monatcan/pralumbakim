
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  const { branchId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Access Control
    // If Client User, check if they own the branch
    if (session.user.role === 'PROJECT_MANAGER' || session.user.role === 'BRANCH_MANAGER') {
        const branch = await prisma.branch.findUnique({
            where: { id: branchId },
            select: { clientId: true }
        });
        
        // Assuming session.user (from token) would ideally have clientId. 
        // Our current NextAuth callbacks might not be passing clientId fully if not added to session type explicitly yet 
        // but let's check user logic.
        // We need to fetch User to get clientId if it's not in session
        const featureUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { clients: { select: { id: true } } }
        });
        
        const userClientIds = featureUser?.clients.map(c => c.id) || [];

        if (branch?.clientId && !userClientIds.includes(branch.clientId)) {
             return NextResponse.json({ error: 'Access Denied' }, { status: 403 })
        }
    }

    const logs = await prisma.maintenanceLog.findMany({
      where: {
        branchId: branchId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          select: { fullName: true }
        },
        _count: {
          select: { photos: true, checklistItems: true }
        }
      }
    })

    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching logs' }, { status: 500 })
  }
}
