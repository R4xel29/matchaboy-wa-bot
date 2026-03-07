import { prisma } from './prisma'

export async function logAdminAction({
  userId,
  action,
  entity,
  entityId,
  details
}: {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'OTHER' | string;
  entity: 'PRODUCT' | 'CATEGORY' | 'USER' | 'ORDER' | 'SYSTEM' | string;
  entityId?: string;
  details?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details
      }
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}
