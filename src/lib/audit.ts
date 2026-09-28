import { db } from "@/lib/db";

export async function logAction({
  actorId,
  action,
  entity,
  entityId,
}: {
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
}) {
  return db.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
    },
  });
}
