
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { branchId, notes, templateId } = body

    if (!branchId) {
        return NextResponse.json({ error: 'Branch ID required' }, { status: 400 })
    }

    let checklistData: { question: string; isChecked: boolean }[] = [];
    let instructions: string | null = null;

    // Strategy:
    // 1. If templateId provided, use it.
    // 2. If no templateId, try to find Client default (optional logic) or Global default.
    // 3. Fallback to hardcoded.

    if (templateId) {
        const selectedTemplate = await prisma.checklistTemplate.findUnique({
            where: { id: templateId }
        });
         if (selectedTemplate && Array.isArray(selectedTemplate.items)) {
            checklistData = (selectedTemplate.items as string[]).map(q => ({
                question: q,
                isChecked: false
            }));
            if (selectedTemplate.instructions) {
                instructions = selectedTemplate.instructions;
            }
        }
    } 
    
    // Fallback if no template selected OR selected template was empty/invalid
    if (checklistData.length === 0) {
        // Fallback to hardcoded Default
        checklistData = [
            { question: "Genel temizlik kontrolü yapıldı mı?", isChecked: false },
            { question: "Cihaz bağlantıları kontrol edildi mi?", isChecked: false },
            { question: "Güvenlik etiketleri sağlam mı?", isChecked: false },
            { question: "Fonksiyon testleri başarılı mı?", isChecked: false },
            { question: "Müşteriye bilgi verildi mi?", isChecked: false }
        ];
    }

    const log = await prisma.maintenanceLog.create({
      data: {
        branchId,
        staffId: session.user.id as string,
        status: 'IN_PROGRESS',
        notes: notes || '',
        instructions: instructions || null,
        checklistItems: {
            create: checklistData
        }
      }
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error("Error creating maintenance log:", error)
    return NextResponse.json({ error: 'Error creating maintenance log' }, { status: 500 })
  }
}
