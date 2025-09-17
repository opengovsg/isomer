import { meHandlers } from "tests/msw/handlers/me"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"

export const COMMON_HANDLERS = [
  meHandlers.me(),
  resourceHandlers.getRolesFor.admin(),
  sitesHandlers.getSiteName.default(),
  userHandlers.count.default(),
  userHandlers.list.users(),
]
