export const getFileExtension = (fileName: string): string => {
  const index = fileName.lastIndexOf(".")
  return index !== -1 ? fileName.slice(index).toLowerCase() : ""
}
