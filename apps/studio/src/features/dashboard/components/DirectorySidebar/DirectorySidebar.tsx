import { DirectorySidebarContent } from "./DirectorySidebarContent"

interface DirectorySidebarProps {
  siteId: string
}

export const DirectorySidebar = ({
  siteId,
}: DirectorySidebarProps): JSX.Element => {
  return (
    <DirectorySidebarContent
      siteId={siteId}
      resourceId={null}
      item={{ permalink: "/", type: "RootPage" }}
      defaultIndex={0}
    />
  )
}
