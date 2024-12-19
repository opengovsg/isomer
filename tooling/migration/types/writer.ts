export interface Writer {
  write: (
    title: string,
    permalink: string,
    content: string,
  ) => Promise<void> | void;
}
