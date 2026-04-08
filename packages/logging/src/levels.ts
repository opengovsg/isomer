// use syslog protocol levels as per https://datatracker.ietf.org/doc/html/rfc5424#page-10
export const SYSLOG_LEVELS: Record<string, number> = {
  emerg: 80,
  alert: 70,
  crit: 60,
  error: 50,
  warn: 40,
  notice: 30,
  info: 20,
  debug: 10,
}
