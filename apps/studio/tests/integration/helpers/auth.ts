import type { User } from "~server/db"
import { prisma } from "~/server/prisma"

export const auth = (user: User) => {
  if (user.id) {
    return prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: {},
    })
  }

  return prisma.user.create({
    data: user,
  })
}
