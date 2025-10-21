export const ISOMER_ADMINS = [
  "jiachin",
  "sehyun",
  "harish",
  "zhongjun",
  "adriangoh",
  "shazli",
  "rachellin",
  "gautam",
]

export const ISOMER_MIGRATORS = [
  "tingshian",
  "hakeem",
  "elora",
  "junxiang",
  "rayyan",
  "yongteng",
  "huaying",
  "weiping",
  "sophie",
  "felicia",
]

export const PAST_ISOMER_MEMBERS = [
  "kishore",
  "hanpu",
  "alexander",
  "jan",
  "jinhui",
] as const

export const ISOMER_ADMINS_AND_MIGRATORS = [
  ...ISOMER_ADMINS,
  ...ISOMER_MIGRATORS,
]

export const ISOMER_ADMINS_AND_MIGRATORS_EMAILS =
  ISOMER_ADMINS_AND_MIGRATORS.map((username) => `${username}@open.gov.sg`)

// this is a quick hack to determine who to show as "isomer admins" for user management dashboard
// TODO: maybe create a standalone "role" in ResourcePermission instead
export const PAST_AND_FORMER_ISOMER_MEMBERS = [
  ...ISOMER_ADMINS,
  ...ISOMER_MIGRATORS,
  ...PAST_ISOMER_MEMBERS,
]

export const PAST_AND_FORMER_ISOMER_MEMBERS_EMAILS =
  PAST_AND_FORMER_ISOMER_MEMBERS.map((username) => `${username}@open.gov.sg`)
