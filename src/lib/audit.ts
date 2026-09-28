import { db } from "@/lib/db";

export type AuditAction = {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
};

export async function logAction({
  actorId = null,
  action,
  entity,
  entityId,
}: AuditAction): Promise<void> {
  await db.auditLog.create({
    data: { actorId, action, entity, entityId },
  });
}
