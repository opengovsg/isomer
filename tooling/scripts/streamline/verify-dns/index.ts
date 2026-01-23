import { getACMCertificateValidationRecords } from "../utils/aws";
import { getSiteLaunchBatch } from "../utils/csv";
import {
  isDomainARecordsCorrect,
  isDomainCNAMERecordsCorrect,
  isDomainPointingToIndirectionLayer,
} from "../utils/dns";

export const verifyDnsRecords = async () => {
  console.log("Running script to verify DNS records...");
  const siteLaunchSites = await getSiteLaunchBatch();

  for (const site of siteLaunchSites) {
    // Step 1: Obtain the ACM validation record for the domain
    console.log(
      `Generating DNS records for site: ${site.repoName}, domain: ${site.isomerDomain}`
    );

    const record = await getACMCertificateValidationRecords(site.isomerDomain);

    if (!record) {
      console.error(
        `No ACM validation records retrieved for domain: ${site.isomerDomain}`
      );
      continue;
    }

    const acmValidationRecord = await isDomainCNAMERecordsCorrect(
      record.name,
      record.value
    );

    // Step 2: Check if the domain is correctly pointing to the indirection
    // layer
    const isIndirectionCorrect = await isDomainPointingToIndirectionLayer(
      site.isomerDomain
    );

    // Step 3: Check if the redirection domain is correctly pointing to the 3 A
    // records
    const isRedirectionCorrect = site.redirectionDomain
      ? await isDomainARecordsCorrect(site.redirectionDomain)
      : {
          isCorrect: true,
          answer: [],
        };

    // Step 4: Output the DNS verification results
    // TODO: Improve output format
    console.log("DNS Record Verification Results:");
    console.log(
      `- ACM Validation CNAME Record Correct: ${
        acmValidationRecord.isCorrect ? "Yes" : "No"
      }`
    );
    console.log(
      `- Indirection Layer Correct: ${
        isIndirectionCorrect.isCorrect ? "Yes" : "No"
      }`
    );
    console.log(
      `- Redirection Domain A Records Correct: ${
        isRedirectionCorrect.isCorrect ? "Yes" : "No"
      }`
    );
    console.log("---------------------------------------------------");
  }
};
