export const ISOMER_ADMINS = [
  "alexander",
  "jan",
  "jiachin",
  "sehyun",
  "harish",
  "zhongjun",
  "adriangoh",
  "shazli",
  "jinhui",
  "rachellin",
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

export const ISOMER_ADMINS_AND_MIGRATORS = [
  ...ISOMER_ADMINS,
  ...ISOMER_MIGRATORS,
]

export const ISOMER_ADMINS_AND_MIGRATORS_EMAILS =
  ISOMER_ADMINS_AND_MIGRATORS.map((username) => `${username}@open.gov.sg`)
