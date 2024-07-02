export interface SearchRecord {
  id: string;
  title: string;
  content: string;
  url: string;
}

export interface SearchProps {
  index: SearchRecord[];
}
