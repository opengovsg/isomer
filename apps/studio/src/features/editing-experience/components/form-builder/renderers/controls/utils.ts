function getMIMEFromDataURL(dataURL: string): string {
  const prefix = dataURL.split(",")[0] || ""
  const mediaType = prefix.split(":")[1] || ""
  let mimeType = mediaType.split(";")[0] || ""
  mimeType = mimeType === "image/jpg" ? "image/jpeg" : mimeType
  return mimeType.toUpperCase()
}
export function imageDataURLToFile(imageDataURL: string): File | undefined {
  if (!imageDataURL) {
    return undefined
  }
  const splitInput = imageDataURL.split(",")
  const byteString = atob(splitInput[1] || "")
  const mimeType = getMIMEFromDataURL(imageDataURL)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new File([ia], "Current image", { type: mimeType })
}
export async function BlobToImageDataURL(
  blob: Blob,
  extension: string,
): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const base64String = Buffer.from(arrayBuffer).toString("base64")
  const base64Data = `data:image/${extension};base64,${base64String}`
  return base64Data
}
