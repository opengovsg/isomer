import type { PrismaClient } from "@isomer/db/prisma";

import { type SgidSessionProfile } from "./sgid.utils";

export const upsertSgidAccountAndUser = async ({
  prisma,
  pocdexEmail,
  name,
}: {
  prisma: PrismaClient;
  pocdexEmail: NonNullable<SgidSessionProfile["list"][number]["work_email"]>;
  name: SgidSessionProfile["name"];
  sub: SgidSessionProfile["sub"];
}) => {
  return prisma.$transaction(async (tx) => {
    // Create user from email
    const user = await tx.user.upsert({
      where: {
        email: pocdexEmail,
      },
      update: {},
      create: {
        email: pocdexEmail,
        name,
        // TODO: add later
        phone: "",
      },
    });

    return user;
  });
};
