// Credits: https://github.com/jsdelivr/globalping-probe/blob/df9110ecf08c39474e3e2e16d69aa7145ca71c58/%40types/node-dig-dns.d.ts
declare module "node-dig-dns" {
  export interface SingleDnsQueryResult {
    domain: string;
    type: string;
    ttl: number;
    class: string;
    value: string;
  }

  export interface DnsQueryResult {
    answer: SingleDnsQueryResult[];
    time: number;
    server: string;
  }

  export function dig(args: string[]): Promise<DnsQueryResult>;

  export default dig;
}
