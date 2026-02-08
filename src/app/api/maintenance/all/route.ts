
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
    const session = await getServerSession(authOptions)
    
    // Authorization: Allow all authenticated users (specific filters applied below)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        let whereClause: any = {};
        const role = session.user.role;

        // 1. SUPER_ADMIN: No Filter (Sees everything)
        // 2. PROJECT_MANAGER: Only logs related to Assigned Clients
        if (role === 'PROJECT_MANAGER') {
            const userWithClients = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: { clients: true }
            });
            
            if (!userWithClients || userWithClients.clients.length === 0) {
                return NextResponse.json([]); 
            }
            const clientIds = userWithClients.clients.map(c => c.id);
            whereClause = { 
                branch: { clientId: { in: clientIds } } 
            };
        }
        
        // 3. BRANCH_MANAGER: Only logs related to Assigned Branches
        else if (role === 'BRANCH_MANAGER') {
            const userWithBranches = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: { assignedBranches: true }
            });

            if (!userWithBranches || userWithBranches.assignedBranches.length === 0) {
                return NextResponse.json([]); 
            }
            const branchIds = userWithBranches.assignedBranches.map(b => b.id);
            whereClause = {
                branchId: { in: branchIds }
            };
        }

        // 4. FIELD_STAFF: Only logs where they are the assignee
        else if (role === 'FIELD_STAFF') {
            whereClause = {
                staffId: session.user.id
            };
        }

        const logs = await prisma.maintenanceLog.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            include: {
                branch: {
                    select: {
                        name: true,
                        client: {
                            select: { name: true }
                        }
                    }
                },
                staff: {
                    select: { fullName: true }
                }
            },
            take: 100 // Limit for now
        })
        return NextResponse.json(logs)
    } catch (error) {
        return NextResponse.json({ error: 'Log fetch failed' }, { status: 500 })
    }
}
