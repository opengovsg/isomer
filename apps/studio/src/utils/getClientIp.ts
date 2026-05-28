import { type NextApiRequest } from "next"

const LOCALHOST_IP = "127.0.0.1"

const getIpList = (header: string | string[] | null | undefined) =>
  (Array.isArray(header) ? header : [header])
    .flatMap((value) => value?.split(",") ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

const getFirstIp = (header: string | string[] | null | undefined) =>
  getIpList(header)[0]

const getLastIp = (header: string | string[] | null | undefined) => {
  const ips = getIpList(header)
  // Proxies append to X-Forwarded-For, so the leftmost value can be supplied
  // by the client. Use the rightmost value only as a last-resort fallback.
  return ips[ips.length - 1]
}

const isRequest = (request: Request | NextApiRequest): request is Request =>
  typeof Request !== "undefined" && request instanceof Request

export default function getIP(request: Request | NextApiRequest) {
  const cfConnectingIp = isRequest(request)
    ? request.headers.get("cf-connecting-ip")
    : request.headers["cf-connecting-ip"]
  const remoteAddress = isRequest(request)
    ? undefined
    : request.socket.remoteAddress?.trim() || undefined
  const xForwardedFor = isRequest(request)
    ? request.headers.get("x-forwarded-for")
    : request.headers["x-forwarded-for"]

  // Prefer values set by our edge/proxy infrastructure before consulting
  // X-Forwarded-For, which may contain client-supplied entries.
  return (
    getFirstIp(cfConnectingIp) ??
    remoteAddress ??
    getLastIp(xForwardedFor) ??
    LOCALHOST_IP
  )
}
