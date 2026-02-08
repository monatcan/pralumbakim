
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { branchId, code } = body

    if (!branchId || !code) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const branch = await prisma.branch.findUnique({
      where: {
        id: branchId
      },
      include: {
        client: {
          select: {
            name: true,
            logo: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Şube bulunamadı' }, { status: 404 })
    }

    if (branch.qrCode !== code) {
      return NextResponse.json({ error: 'Geçersiz QR Kod' }, { status: 400 })
    }

    // Fetch related templates for this client + Global templates
    const templates = await prisma.checklistTemplate.findMany({
        where: {
            OR: [
                { clientId: branch.clientId },
                { isGlobal: true }
            ]
        },
        select: {
            id: true,
            name: true,
            isGlobal: true,
            items: true // Optional: we might not need items here, just name/id for selection
        }
    });

    // Check for active maintenance logs for this branch
    const activeLogs = await prisma.maintenanceLog.findMany({
        where: {
            branchId: branch.id,
            status: {
                in: ['IN_PROGRESS', 'NEEDS_VISIT', 'INCOMPLETE', 'PENDING_APPROVAL', 'PENDING']
            }
        },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            date: true,
            status: true,
            staff: { select: { fullName: true } }
        }
    });

    return NextResponse.json({ valid: true, branch, templates, activeLogs })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
