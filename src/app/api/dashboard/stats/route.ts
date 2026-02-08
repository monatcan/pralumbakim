
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const role = session.user.role;
        const userId = session.user.id;

        let clientWhere = {};
        let branchWhere = {};
        let userWhere = {};
        let maintenanceWhere: any = { status: 'IN_PROGRESS' };

        if (role === 'PROJECT_MANAGER') {
            const user = await prisma.user.findUnique({ 
                where: { id: userId }, 
                include: { clients: true } 
            });
            const clientIds = user?.clients.map(c => c.id) || [];

            clientWhere = { id: { in: clientIds } };
            branchWhere = { clientId: { in: clientIds } };
            // Users associated with these clients (This is an approximation, filtering users by branch assignment is better)
            userWhere = { 
                assignedBranches: { 
                    some: { clientId: { in: clientIds } } 
                } 
            };
            maintenanceWhere = {
                status: 'IN_PROGRESS',
                branch: { clientId: { in: clientIds } }
            };

        } else if (role === 'BRANCH_MANAGER') {
            const user = await prisma.user.findUnique({ 
                where: { id: userId }, 
                include: { assignedBranches: { include: { client: true } } } 
            });
            const branchIds = user?.assignedBranches.map(b => b.id) || [];
            // Get unique Client IDs from assigned branches
            const clientIds = Array.from(new Set(user?.assignedBranches.map(b => b.client.id)));

            clientWhere = { id: { in: clientIds } };
            branchWhere = { id: { in: branchIds } };
            // Users assigned to these branches
            userWhere = { 
                assignedBranches: { 
                    some: { id: { in: branchIds } } 
                } 
            };
            maintenanceWhere = {
                status: 'IN_PROGRESS',
                branchId: { in: branchIds }
            };
            
        } else if (role === 'FIELD_STAFF') {
             // Field Staff sees their own tasks
             const user = await prisma.user.findUnique({ 
                where: { id: userId }, 
                include: { assignedBranches: { include: { client: true } } } 
            });
            const branchIds = user?.assignedBranches.map(b => b.id) || [];
            const clientIds = Array.from(new Set(user?.assignedBranches.map(b => b.client.id)));

            clientWhere = { id: { in: clientIds } };
            branchWhere = { id: { in: branchIds } };
             userWhere = { id: userId }; // Only sees themselves
             maintenanceWhere = {
                status: 'IN_PROGRESS',
                staffId: userId
            };
        }

        const [clientCount, branchCount, userCount, activeMaintenanceCount] = await Promise.all([
            prisma.client.count({ where: clientWhere }),
            prisma.branch.count({ where: branchWhere }),
            prisma.user.count({ where: userWhere }),
            prisma.maintenanceLog.count({ where: maintenanceWhere })
        ]);

        return NextResponse.json({
            clients: clientCount,
            branches: branchCount,
            users: userCount,
            activeMaintenances: activeMaintenanceCount
        });
    } catch (error) {
        return NextResponse.json({ error: 'Stats error' }, { status: 500 })
    }
}
