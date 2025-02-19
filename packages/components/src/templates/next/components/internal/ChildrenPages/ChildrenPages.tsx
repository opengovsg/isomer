import type { ChildrenPagesProps } from "~/interfaces"
import { CARDS_WITHOUT_IMAGES } from "~/interfaces/complex/InfoCards"
import { getNodeFromSiteMap } from "~/utils"
import { InfoCards } from "../../complex"

const ChildrenPages = ({
  permalink,
  layout,
  site,
  LinkComponent,
}: ChildrenPagesProps) => {
  const currentPageNode = getNodeFromSiteMap(site.siteMap, permalink)

  if (!currentPageNode?.children) {
    return <></>
  }

  const children = currentPageNode.children.map((child) => ({
    title: child.title,
    url: child.permalink,
    description: child.summary,
  }))

  return (
    <InfoCards
      type="infocards"
      // NOTE: We are bypassing the validation here as we are reusing the
      // InfoCards component but we do not need a title here
      title=""
      variant={CARDS_WITHOUT_IMAGES}
      cards={children}
      maxColumns="1"
      layout={layout}
      site={site}
      LinkComponent={LinkComponent}
    />
  )
}

export default ChildrenPages
