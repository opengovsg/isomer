// MSW handlers for the data.gov.sg (DGS) APIs.
//
// The database-layout preview renders an Isomer data table that fetches live from
// data.gov.sg, and the "Link a dataset" modal validates dataset IDs against the DGS
// metadata API. In Storybook these requests are otherwise unmocked (the preview sets
// `onUnhandledRequest: "bypass"`), so they hit the real network — making the database
// stories non-deterministic (variable data + timing) and the visual-diff gate flaky.
//
// These handlers return fixed fixtures captured from the real APIs (records truncated)
// so the table and the validation render deterministically.
//
// Endpoints mirrored (see packages/components):
//   - GET https://data.gov.sg/api/action/datastore_search        (useDgsData)
//   - GET https://api-production.data.gov.sg/.../metadata          (useDgsMetadata)
//   - GET https://api-open.data.gov.sg/.../initiate-download|poll-download (DownloadButton)
import { http, HttpResponse } from "msw"

// Per-dataset metadata fixtures, mirroring the real data.gov.sg responses.
//
// Non-CSV datasets must be faithful: a real "API"-format dataset (e.g. "Taxi
// Availability", d_e25662...) returns NO `columnMetadata` — returning CSV-style
// column metadata for it (as a generic mock would) is wrong and makes the
// "non-CSV dataset" validation story render inconsistently. Each entry here is the
// real `data` object (sans the dataset-specific column metadata, added for CSV below).
const METADATA_BY_ID: Record<
  string,
  { name: string; format: string; managedBy?: string; datasetSize: number }
> = {
  // data.gov.sg "Taxi Availability" — real format "API", no columnMetadata.
  d_e25662f1a062dd046453926aa284ba64: {
    name: "Taxi Availability",
    format: "API",
    managedBy: "Land Transport Authority",
    datasetSize: 4417,
  },
}

// Real columns of the "Graduate Employment Survey" dataset (d_3c55...), in order.
// `name` matches the record keys; `columnTitle` is the display label.
const GES_COLUMNS: { name: string; columnTitle: string }[] = [
  { name: "year", columnTitle: "Year" },
  { name: "university", columnTitle: "University" },
  { name: "school", columnTitle: "School" },
  { name: "degree", columnTitle: "Degree" },
  {
    name: "employment_rate_overall",
    columnTitle: "Overall Employment Rate (%)",
  },
  {
    name: "employment_rate_ft_perm",
    columnTitle: "Full-Time Permanent Employment Rate (%)",
  },
  { name: "basic_monthly_mean", columnTitle: "Basic Monthly Mean ($)" },
  { name: "basic_monthly_median", columnTitle: "Basic Monthly Median ($)" },
  { name: "gross_monthly_mean", columnTitle: "Gross Monthly Mean ($)" },
  { name: "gross_monthly_median", columnTitle: "Gross Monthly Median ($)" },
  {
    name: "gross_mthly_25_percentile",
    columnTitle: "Gross Monthly 25th Percentile ($)",
  },
  {
    name: "gross_mthly_75_percentile",
    columnTitle: "Gross Monthly 75th Percentile ($)",
  },
]

// Real records (truncated to 8) from d_3c55210de27fcccda2ed0c63fdd2b352.
const GES_RECORDS: Record<string, string>[] = [
  {
    year: "2013",
    university: "Nanyang Technological University",
    school: "College of Business (Nanyang Business School)",
    degree: "Accountancy and Business",
    employment_rate_overall: "97.4",
    employment_rate_ft_perm: "96.1",
    basic_monthly_mean: "3701",
    basic_monthly_median: "3200",
    gross_monthly_mean: "3727",
    gross_monthly_median: "3350",
    gross_mthly_25_percentile: "2900",
    gross_mthly_75_percentile: "4000",
  },
  {
    year: "2013",
    university: "Nanyang Technological University",
    school: "College of Business (Nanyang Business School)",
    degree: "Accountancy (3-yr direct Honours Programme)",
    employment_rate_overall: "97.1",
    employment_rate_ft_perm: "95.7",
    basic_monthly_mean: "2850",
    basic_monthly_median: "2700",
    gross_monthly_mean: "2938",
    gross_monthly_median: "2700",
    gross_mthly_25_percentile: "2700",
    gross_mthly_75_percentile: "2900",
  },
  {
    year: "2013",
    university: "Nanyang Technological University",
    school: "College of Business (Nanyang Business School)",
    degree: "Business (3-yr direct Honours Programme)",
    employment_rate_overall: "90.9",
    employment_rate_ft_perm: "85.7",
    basic_monthly_mean: "3053",
    basic_monthly_median: "3000",
    gross_monthly_mean: "3214",
    gross_monthly_median: "3000",
    gross_mthly_25_percentile: "2700",
    gross_mthly_75_percentile: "3500",
  },
  {
    year: "2013",
    university: "Nanyang Technological University",
    school: "College of Business (Nanyang Business School)",
    degree: "Business and Computing",
    employment_rate_overall: "87.5",
    employment_rate_ft_perm: "87.5",
    basic_monthly_mean: "3557",
    basic_monthly_median: "3400",
    gross_monthly_mean: "3615",
    gross_monthly_median: "3400",
    gross_mthly_25_percentile: "3000",
    gross_mthly_75_percentile: "4100",
  },
  {
    year: "2013",
    university: "Nanyang Technological University",
    school: "College of Engineering",
    degree: "Aerospace Engineering",
    employment_rate_overall: "95.3",
    employment_rate_ft_perm: "95.3",
    basic_monthly_mean: "3494",
    basic_monthly_median: "3500",
    gross_monthly_mean: "3536",
    gross_monthly_median: "3500",
    gross_mthly_25_percentile: "3100",
    gross_mthly_75_percentile: "3816",
  },
  {
    year: "2013",
    university: "Nanyang Technological University",
    school: "College of Engineering",
    degree: "Bioengineering",
    employment_rate_overall: "81.3",
    employment_rate_ft_perm: "68.8",
    basic_monthly_mean: "2952",
    basic_monthly_median: "2900",
    gross_monthly_mean: "3166",
    gross_monthly_median: "3125",
    gross_mthly_25_percentile: "2893",
    gross_mthly_75_percentile: "3365",
  },
  {
    year: "2013",
    university: "Nanyang Technological University",
    school: "College of Engineering",
    degree: "Chemical and Biomolecular Engineering",
    employment_rate_overall: "87.3",
    employment_rate_ft_perm: "85.1",
    basic_monthly_mean: "3235",
    basic_monthly_median: "3000",
    gross_monthly_mean: "3377",
    gross_monthly_median: "3200",
    gross_mthly_25_percentile: "3000",
    gross_mthly_75_percentile: "3800",
  },
  {
    year: "2013",
    university: "Nanyang Technological University",
    school: "College of Engineering",
    degree: "Computer Engineering",
    employment_rate_overall: "90.3",
    employment_rate_ft_perm: "88.2",
    basic_monthly_mean: "3326",
    basic_monthly_median: "3100",
    gross_monthly_mean: "3374",
    gross_monthly_median: "3175",
    gross_mthly_25_percentile: "3000",
    gross_mthly_75_percentile: "3600",
  },
]

const DOWNLOAD_RESPONSE = {
  code: 0,
  data: {
    status: "DOWNLOAD_SUCCESS",
    message: "Download successfully completed",
    url: "https://example.com/mock-graduate-employment-survey.csv",
  },
}

export const dgsHandlers = {
  // GET https://data.gov.sg/api/action/datastore_search?resource_id=...
  datastoreSearch: {
    default: () =>
      http.get(
        "https://data.gov.sg/api/action/datastore_search",
        ({ request }) => {
          const resourceId =
            new URL(request.url).searchParams.get("resource_id") ?? ""
          const records = GES_RECORDS.map((r, i) => ({ _id: i + 1, ...r }))
          return HttpResponse.json({
            success: true,
            result: {
              resource_id: resourceId,
              records,
              total: records.length,
              fields: [
                { id: "_id", type: "int" },
                ...GES_COLUMNS.map((c) => ({ id: c.name, type: "text" })),
              ],
            },
          })
        },
      ),
  },

  // GET https://api-production.data.gov.sg/v2/public/api/datasets/:resourceId/metadata
  metadata: {
    default: () =>
      http.get(
        "https://api-production.data.gov.sg/v2/public/api/datasets/:resourceId/metadata",
        ({ params }) => {
          const resourceId = String(params.resourceId)
          const known = METADATA_BY_ID[resourceId]
          if (known) {
            // Faithful non-CSV/other response: no columnMetadata.
            return HttpResponse.json({
              code: 0,
              data: { datasetId: resourceId, ...known },
              errorMsg: "",
            })
          }
          // Default: a CSV dataset (the GES preview + valid-dataset stories).
          const metaMapping = Object.fromEntries(
            GES_COLUMNS.map((c, index) => [
              `c_${c.name}`,
              {
                name: c.name,
                columnTitle: c.columnTitle,
                index: String(index),
              },
            ]),
          )
          return HttpResponse.json({
            code: 0,
            data: {
              datasetId: resourceId,
              name: "Graduate Employment Survey - NTU, NUS, SIT, SMU, SUSS & SUTD",
              format: "CSV",
              datasetSize: 231578,
              columnMetadata: { metaMapping },
            },
            errorMsg: "",
          })
        },
      ),
  },

  // GET .../initiate-download and .../poll-download (raced by fetchDgsFileDownloadUrl).
  // Returns an array — spread it into the handlers list.
  download: {
    default: () => [
      http.get(
        "https://api-open.data.gov.sg/v1/public/api/datasets/:resourceId/initiate-download",
        () => HttpResponse.json(DOWNLOAD_RESPONSE),
      ),
      http.get(
        "https://api-open.data.gov.sg/v1/public/api/datasets/:resourceId/poll-download",
        () => HttpResponse.json(DOWNLOAD_RESPONSE),
      ),
    ],
  },
}
