
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  const { logId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id: logId },
      include: {
        branch: {
            select: { name: true, address: true }
        },
        checklistItems: true,
        photos: true,
        staff: {
            select: { fullName: true }
        }
      }
    })

    if (!log) {
        return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    // Access Control can be added here
    // e.g. Clients can only see if log.branch.clientId == session.user.clientId

    return NextResponse.json(log)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  const { logId } = await params
  const session = await getServerSession(authOptions)
  
  // Authorization:
  // - FIELD_STAFF: Can update status to IN_PROGRESS, COMPLETED, add photos, notes.
  // - PROJECT_MANAGER / BRANCH_MANAGER: Can update status to APPROVED, REJECTED.
  // - SUPER_ADMIN: Can do everything including isArchived.
  
  const role = session?.user.role;
  const authorized = role === 'SUPER_ADMIN' || role === 'FIELD_STAFF' || role === 'PROJECT_MANAGER' || role === 'BRANCH_MANAGER';
  
  if (!session || !authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { status, notes, checklistItems, newPhotoUrls, isArchived } = body

    const updateData: any = {}

    // Handle Status Changes
    if (status) {
        updateData.status = status;
        
        // Use completedAt when status changes to COMPLETED or APPROVED
        if (status === 'COMPLETED' || status === 'APPROVED') {
             // Only set if not already set, or update strictly on completion?
             // Usually we want the timestamp of when it was marked completed.
             updateData.completedAt = new Date();
        }

        // If status is CANCELLED, automatically archive it
        if (status === 'CANCELLED') {
             updateData.isArchived = true;
        }
    }

    if (notes !== undefined) updateData.notes = notes;
    if (isArchived !== undefined && role === 'SUPER_ADMIN') updateData.isArchived = isArchived;

    // 2. Add Photos if provided (Array)
    if (newPhotoUrls && Array.isArray(newPhotoUrls) && newPhotoUrls.length > 0) {
        updateData.photos = {
            create: newPhotoUrls.map((url: string) => ({ url }))
        }
    }

    // 3. Update Checklist Items
    if (checklistItems && Array.isArray(checklistItems)) {
        await Promise.all(
            checklistItems.map((item: any) => 
                prisma.checklistItem.update({
                    where: { id: item.id },
                    data: { isChecked: item.isChecked, note: item.note }
                })
            )
        );
    } // ... rest is same

    const updatedLog = await prisma.maintenanceLog.update({
      where: { id: logId },
      data: updateData,
      include: {
        checklistItems: true,
        photos: true
      }
    })

    return NextResponse.json(updatedLog)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
