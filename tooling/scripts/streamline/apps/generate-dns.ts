import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

import { getACMCertificateValidationRecords } from "../utils/acm";
import {
  getAllCloudFrontDistributions,
  getCloudFrontDistributionDomainName,
} from "../utils/cloudfront";
import { getOnboardingBatch } from "../utils/csv";
import {
  isDomainARecordsCorrect,
  isDomainPointingToIndirectionLayer,
} from "../utils/dns";
import { addXlsxSheet, createXlsxBook, writeToXlsxFile } from "../utils/xlsx";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

interface ReportRow {
  repoName: string;
  domainName: string;
  siteId: string;
  cloudfront: string;
  acmRecordName: string;
  acmRecordValue: string;
  isIndirectionLayerUpdateNeeded: boolean;
  // NOTE: We are making an assumption that the apex domain will definitely have
  // at least one of the A records, and if this is true then we will just add
  // the 2 missing A records
  isRedirectionRecordsUpdateNeeded: boolean;
}

const DNS_RECORDS_SHEET_COLUMNS = [
  "Site name",
  "Domain name",
  "Isomer Studio link",
  "CloudFront domain",
  "ACM Record Name",
  "ACM Record Value",
  "Indirection Layer",
  "Redirection Records",
];

const getReportRow = (row: ReportRow) => {
  const indirectionSlug = row.domainName
    .replace(/www\./, "")
    .replace(/\./g, "-");

  return [
    row.repoName,
    row.domainName,
    `https://studio.isomer.gov.sg/sites/${row.siteId}`,
    row.cloudfront,
    row.acmRecordName,
    row.acmRecordValue,
    row.isIndirectionLayerUpdateNeeded
      ? "No changes needed"
      : `Update to ${indirectionSlug}.hostedon.isomer.gov.sg`,
    row.isRedirectionRecordsUpdateNeeded
      ? "No changes needed"
      : "Add 2 A records pointing to 18.138.108.8 and 18.139.47.66",
  ];
};

export const generateDnsRecords = async () => {
  console.log("Running script to generate DNS records...");
  const onboardingSites = await getOnboardingBatch();
  const cloudfrontDistributions = await getAllCloudFrontDistributions();

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const output: ReportRow[] = [];

  try {
    await client.connect();
    for (const site of onboardingSites) {
      // Step 1: Obtain the ACM validation record for the domain
      console.log(
        `Generating DNS records for site: ${site.repoName}, domain: ${site.isomerDomain}`
      );

      const record = await getACMCertificateValidationRecords(
        site.isomerDomain
      );

      if (!record) {
        console.error(
          `No ACM validation records retrieved for domain: ${site.isomerDomain}`
        );
        continue;
      }

      // Step 2: Check if the domain needs to be updated to point to the
      // indirection layer
      const isIndirectionCorrect = await isDomainPointingToIndirectionLayer(
        site.isomerDomain
      );

      // Step 3: Check if the redirection domain needs to be updated to point to
      // the 3 A records
      const isRedirectionCorrect = site.redirectionDomain
        ? await isDomainARecordsCorrect(site.redirectionDomain)
        : {
            isCorrect: true,
            answer: [],
          };

      const cloudfrontDomain = getCloudFrontDistributionDomainName(
        cloudfrontDistributions,
        site.repoName
      );

      // Step 4: Output the DNS updates required
      const dbSite = await client.query(
        `SELECT id, name FROM public."Site" WHERE "codeBuildId" = $1`,
        [site.repoName]
      );

      if (dbSite.rowCount === 0) {
        console.error(`No site found in DB for repo: ${site.repoName}`);
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const siteId = dbSite.rows[0].id as string;
      output.push({
        repoName: site.repoName,
        domainName: site.isomerDomain,
        siteId,
        cloudfront: cloudfrontDomain || "N/A",
        acmRecordName: record.name,
        acmRecordValue: record.value,
        isIndirectionLayerUpdateNeeded: !isIndirectionCorrect.isCorrect,
        isRedirectionRecordsUpdateNeeded: !isRedirectionCorrect.isCorrect,
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }

  // Create 4 sheets for the 4 different types:
  const workbook = createXlsxBook();

  // 1. Only need to add ACM validation record
  addXlsxSheet(
    workbook,
    "Only ACM to add",
    DNS_RECORDS_SHEET_COLUMNS,
    output
      .filter(
        ({
          isIndirectionLayerUpdateNeeded,
          isRedirectionRecordsUpdateNeeded,
        }) =>
          !isIndirectionLayerUpdateNeeded && !isRedirectionRecordsUpdateNeeded
      )
      .map((row) => getReportRow(row))
  );

  // 2. Add ACM validation record and update indirection layer
  addXlsxSheet(
    workbook,
    "Add ACM and update indirection",
    DNS_RECORDS_SHEET_COLUMNS,
    output
      .filter(
        ({
          isIndirectionLayerUpdateNeeded,
          isRedirectionRecordsUpdateNeeded,
        }) =>
          isIndirectionLayerUpdateNeeded && !isRedirectionRecordsUpdateNeeded
      )
      .map((row) => getReportRow(row))
  );

  // 3. Add ACM validation record and add missing A records
  addXlsxSheet(
    workbook,
    "Add ACM and A records",
    DNS_RECORDS_SHEET_COLUMNS,
    output
      .filter(
        ({
          isIndirectionLayerUpdateNeeded,
          isRedirectionRecordsUpdateNeeded,
        }) =>
          !isIndirectionLayerUpdateNeeded && isRedirectionRecordsUpdateNeeded
      )
      .map((row) => getReportRow(row))
  );

  // 4. Add ACM validation record, update indirection layer and add missing A records
  addXlsxSheet(
    workbook,
    "Update all",
    DNS_RECORDS_SHEET_COLUMNS,
    output
      .filter(
        ({
          isIndirectionLayerUpdateNeeded,
          isRedirectionRecordsUpdateNeeded,
        }) => isIndirectionLayerUpdateNeeded && isRedirectionRecordsUpdateNeeded
      )
      .map((row) => getReportRow(row))
  );

  const finalBook = writeToXlsxFile(workbook);

  // Write the workbook to a file
  const outputPath = path.join(
    __dirname,
    "..",
    "output",
    `dns-records-${Date.now()}.xlsx`
  );
  await fs.promises.writeFile(outputPath, finalBook);
  console.log(`DNS records report generated at: ${outputPath}`);
};
