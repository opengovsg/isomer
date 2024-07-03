import type { User } from "@isomer/db/prisma";
import { prisma } from "@isomer/db/prisma";

export const auth = (user: User) => {
  if (user.id) {
    return prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: {},
    });
  }

  return prisma.user.create({
    data: user,
  });
};
