export interface BreadcrumbLink {
  title: string;
  url: string;
}
export interface BreadcrumbProps {
  links: BreadcrumbLink[];
  LinkComponent?: any;
}
