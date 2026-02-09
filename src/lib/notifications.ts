import { prisma } from "./prisma";

export async function checkAndCreateDuplicateNotification(
  dehpNumber: string
): Promise<void> {
  const count = await prisma.submission.count({
    where: { dehpNumber },
  });

  if (count < 2) return;

  await prisma.notification.upsert({
    where: {
      type_dehpNumber: {
        type: "DEHP_DUPLICATE",
        dehpNumber,
      },
    },
    update: {
      lastSeenCount: count,
      isClosed: false,
      closedAt: null,
    },
    create: {
      type: "DEHP_DUPLICATE",
      dehpNumber,
      lastSeenCount: count,
    },
  });
}
