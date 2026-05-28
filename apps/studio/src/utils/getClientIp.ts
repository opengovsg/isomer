import { type NextApiRequest } from "next"

const LOCALHOST_IP = "127.0.0.1"
const DEFAULT_TRUSTED_PROXY_HOPS = 1

const getTrustedProxyHopCount = () => {
  const configuredHopCount = Number.parseInt(
    process.env.CLIENT_IP_TRUSTED_PROXY_HOPS ?? "",
    10,
  )

  return Number.isInteger(configuredHopCount) && configuredHopCount > 0
    ? configuredHopCount
    : DEFAULT_TRUSTED_PROXY_HOPS
}

const getIpList = (header: string | string[] | null | undefined) =>
  (Array.isArray(header) ? header : [header])
    .flatMap((value) => value?.split(",") ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

const getFirstIp = (header: string | string[] | null | undefined) =>
  getIpList(header)[0]

const getTrustedXForwardedForIp = (
  header: string | string[] | null | undefined,
) => {
  const ips = getIpList(header)

  if (ips.length === 0) {
    return undefined
  }

  return ips[Math.max(ips.length - getTrustedProxyHopCount(), 0)]
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

  return (
    getFirstIp(cfConnectingIp) ??
    remoteAddress ??
    getTrustedXForwardedForIp(xForwardedFor) ??
    LOCALHOST_IP
  )
}
