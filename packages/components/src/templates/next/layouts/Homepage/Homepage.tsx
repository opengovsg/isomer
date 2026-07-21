import { type HomePageSchemaType } from "~/types"

import { renderPageContent } from "../../render"
import { HomepageLayoutSkeleton } from "../HomepageSkeleton"

export const HomepageLayout = (props: HomePageSchemaType) => {
  return (
    <HomepageLayoutSkeleton {...props} renderPageContent={renderPageContent} />
  )
}
