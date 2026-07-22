// Thin wrapper over the audit log export module's queries
// (`~/server/modules/audit/auditLogExport.query`) — that module is the single
// source of truth for the report queries and CSV serialisation; this script
// only orchestrates per-site execution and file output.
//
// Behavior change vs the old standalone script: the export range uses SGT
// (Asia/Singapore) month boundaries with a half-open end (instead of local-tz
// startOfMonth/endOfMonth), the users report is point-in-time as of the end
// of the range (ADR 0003) instead of "has access now", PermissionDelete
// descriptions now render the revoked user's email, and CSV timestamps are
// rendered in SGT (+08:00) instead of UTC.
import type { IsoMonth } from "~/schemas/audit"
import { format, subMonths } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import fs from "fs"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
import {
  getAccessReportRows,
  getActivityReportRows,
  getMonthDateRange,
  toCsv,
} from "~/server/modules/audit/auditLogExport.query"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Sites requiring audit logs
const SITES_WITH_AUDIT_LOGS = [
  1, // stb.gov.sg
  41, // ssg.gov.sg
  46, // sportsingapore.gov.sg
  48, // muis.gov.sg
  50, // knowledgehub.clc.gov.sg
  53, // clc.gov.sg
  61, // ipos.gov.sg
  109, // agc.gov.sg
  145, // ite.edu.sg
  157, // pmo.gov.sg
  166, // mti.gov.sg
  176, // colombo.mfa.gov.sg
  177, // prague.mfa.gov.sg
  178, // casablanca.mfa.gov.sg
  179, // santiago.mfa.gov.sg
  180, // vienna.mfa.gov.sg
  181, // mexico-city.mfa.gov.sg
  182, // lisbon.mfa.gov.sg
  183, // hamburg.mfa.gov.sg
  184, // copenhagen.mfa.gov.sg
  185, // miami.mfa.gov.sg
  186, // karachi.mfa.gov.sg
  187, // barcelona.mfa.gov.sg
  188, // warsaw.mfa.gov.sg
  189, // toronto.mfa.gov.sg
  190, // port-moresby.mfa.gov.sg
  191, // frankfurt.mfa.gov.sg
  192, // amman.mfa.gov.sg
  193, // rome.mfa.gov.sg
  194, // helsinki.mfa.gov.sg
  195, // madrid.mfa.gov.sg
  196, // lagos.mfa.gov.sg
  197, // osaka.mfa.gov.sg
  198, // munich.mfa.gov.sg
  199, // istanbul.mfa.gov.sg
  200, // athens.mfa.gov.sg
  201, // oslo.mfa.gov.sg
  202, // beirut.mfa.gov.sg
  203, // bogota.mfa.gov.sg
  204, // dublin.mfa.gov.sg
  205, // budapest.mfa.gov.sg
  206, // lima.mfa.gov.sg
  207, // vancouver.mfa.gov.sg
  208, // astana.mfa.gov.sg
  209, // canberra.mfa.gov.sg
  210, // dhaka.mfa.gov.sg
  211, // brussels.mfa.gov.sg
  212, // brasilia.mfa.gov.sg
  213, // brunei.mfa.gov.sg
  214, // phnompenh.mfa.gov.sg
  215, // beijing.mfa.gov.sg
  216, // chengdu.mfa.gov.sg
  217, // guangzhou.mfa.gov.sg
  218, // hongkong.mfa.gov.sg
  219, // shanghai.mfa.gov.sg
  220, // xiamen.mfa.gov.sg
  221, // cairo.mfa.gov.sg
  222, // paris.mfa.gov.sg
  223, // berlin.mfa.gov.sg
  224, // chennai.mfa.gov.sg
  225, // mumbai.mfa.gov.sg
  226, // new-delhi.mfa.gov.sg
  227, // batam.mfa.gov.sg
  228, // jakarta.mfa.gov.sg
  229, // medan.mfa.gov.sg
  230, // asean.mfa.gov.sg
  231, // geneva-un.mfa.gov.sg
  232, // newyork-un.mfa.gov.sg
  233, // vienna-un.mfa.gov.sg
  234, // geneva-wto.mfa.gov.sg
  235, // tel-aviv.mfa.gov.sg
  236, // tokyo.mfa.gov.sg
  237, // seoul.mfa.gov.sg
  238, // vientiane.mfa.gov.sg
  239, // jb.mfa.gov.sg
  240, // kl.mfa.gov.sg
  241, // yangon.mfa.gov.sg
  242, // wellington.mfa.gov.sg
  243, // muscat.mfa.gov.sg
  244, // manila.mfa.gov.sg
  245, // doha.mfa.gov.sg
  246, // moscow.mfa.gov.sg
  247, // jeddah.mfa.gov.sg
  248, // riyadh.mfa.gov.sg
  249, // pretoria.mfa.gov.sg
  250, // taipei.mfa.gov.sg
  251, // bangkok.mfa.gov.sg
  252, // dili.mfa.gov.sg
  253, // ankara.mfa.gov.sg
  254, // abudhabi.mfa.gov.sg
  255, // dubai.mfa.gov.sg
  256, // london.mfa.gov.sg
  257, // newyork-consulate.mfa.gov.sg
  258, // sanfrancisco.mfa.gov.sg
  259, // washington.mfa.gov.sg
  260, // hanoi.mfa.gov.sg
  261, // hochiminhcity.mfa.gov.sg
  262, // www.mfa.gov.sg
  263, // nagoya.mfa.gov.sg
  278, // istana.gov.sg
  284, // www.ptc.gov.sg
  287, // www.mot.gov.sg
  289, // www.toteboard.gov.sg
  301, // space.gov.sg
  334, // seab.gov.sg
  336, // www.caringcommuters.gov.sg
  343, // www.motawardsceremony.gov.sg
  357, // www.ago.gov.sg
  378, // osir.gov.sg
  397, // www.rp.edu.sg
  409, // www.hsa.gov.sg
  484, // www.hpb.gov.sg
  492, // www.oneservice.gov.sg
  512, // cap.gov.sg
]

// Month and year to get audit logs for, in the format of YYYY-MM,
// leave empty for previous month
const MONTH_YEAR: IsoMonth | "" = ""

const getAuditLogsForSite = async () => {
  // If MONTH_YEAR is provided, use that, else get the previous month from
  // SGT-today. `toZonedTime` re-labels the instant with SGT wall-clock fields
  // so the month arithmetic runs on the SGT calendar — on a UTC host during
  // the first 8 hours of the 1st (SGT), the UTC clock is still in the previous
  // month and plain `new Date()` would export two months back. The cast is
  // sound because "yyyy-MM" zero-pads the month (same pattern as
  // `getCurrentSingaporeMonth` in `~/schemas/audit`).
  // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const monthYear: IsoMonth = MONTH_YEAR
    ? MONTH_YEAR
    : (format(
        subMonths(toZonedTime(new Date(), "Asia/Singapore"), 1),
        "yyyy-MM",
      ) as IsoMonth)
  const auditLogDateRange = getMonthDateRange(monthYear, new Date())

  for (const siteId of SITES_WITH_AUDIT_LOGS) {
    console.log(`Getting audit logs for siteId: ${siteId}`)

    // Get users with access as of the end of the range (point-in-time)
    const users = await getAccessReportRows({ siteId, auditLogDateRange })

    // Get events within the range
    const events = await getActivityReportRows({ siteId, auditLogDateRange })

    // Save as CSV files
    const usersFilename = `useraccess_${siteId}_${monthYear}.csv`
    const eventsFilename = `auditlogs_${siteId}_${monthYear}.csv`

    const outputDir = path.join(__dirname, "output")
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    fs.writeFileSync(path.join(outputDir, usersFilename), toCsv(users))
    fs.writeFileSync(path.join(outputDir, eventsFilename), toCsv(events))
  }

  console.log('All audit logs saved in "output" folder')
}

// Only run when executed directly, not when imported by tests
const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) await getAuditLogsForSite()
