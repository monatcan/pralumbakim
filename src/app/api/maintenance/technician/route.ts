
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
    const session = await getServerSession(authOptions)
    
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const logs = await prisma.maintenanceLog.findMany({
            where: {
                staffId: session.user.id,
                status: {
                    in: ['PENDING', 'IN_PROGRESS', 'NEEDS_VISIT', 'INCOMPLETE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] 
                },
                isArchived: false
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                branch: {
                    select: {
                        name: true,
                        address: true,
                        client: {
                            select: { name: true }
                        }
                    }
                },
                _count: {
                    select: { checklistItems: true, photos: true }
                }
            }
        })
        return NextResponse.json(logs)
    } catch (error) {
        return NextResponse.json({ error: 'Log fetch failed' }, { status: 500 })
    }
}
