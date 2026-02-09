export interface Resource {
  id: number;
  title: string;
  permalink: string;
  parentId: number | null;
  type: string;
  fullPermalink: string;
  blobId: number | null;
}
