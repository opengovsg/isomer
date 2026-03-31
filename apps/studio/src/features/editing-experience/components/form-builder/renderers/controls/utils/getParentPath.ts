// Helper function to get the path of the parent item by removing the last
// segment
export const getParentPath = (path: string) => {
  return path.split(".").slice(0, -1).join(".")
}
