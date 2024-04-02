import { ContentPageSchema } from "~/engine"
import ContentPageHeader from "../../components/shared/ContentPageHeader"
import Siderail from "../../components/shared/Siderail"
import TableOfContents from "../../components/shared/TableOfContents"
import { Skeleton } from "../Skeleton"
import { renderComponent } from "../render"

const ContentLayout = ({
  site,
  page,
  content,
  LinkComponent,
}: ContentPageSchema) => {
  return (
    <Skeleton site={site} page={page}>
      <div className="lg:hidden">
        {page.sideRail && <Siderail {...page.sideRail} />}
      </div>
      <ContentPageHeader
        {...page.contentPageHeader}
        LinkComponent={LinkComponent}
      />
      <div className="flex gap-[120px] px-6 md:px-10 py-16 max-w-[1240px] mx-auto justify-center">
        {page.sideRail && (
          <div className="hidden lg:block w-full max-w-[240px]">
            <Siderail {...page.sideRail} LinkComponent={LinkComponent} />
          </div>
        )}
        <div className="flex flex-col gap-[90px] w-full max-w-[800px]">
          <TableOfContents {...page.tableOfContents} />
          <div>
            {content.map((component) =>
              renderComponent({ component, LinkComponent }),
            )}
          </div>
        </div>
      </div>
    </Skeleton>
  )
}

export default ContentLayout
