import { Prisma } from "@prisma/client"

/**
 * Default selector for when retrieving logged in user.
 * It's important to always explicitly say which fields you want to return in order to not leak extra information
 * @see https://github.com/prisma/prisma/issues/9353
 */
export const defaultMeSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  name: true,
  phone: true,
  createdAt: true,
})
