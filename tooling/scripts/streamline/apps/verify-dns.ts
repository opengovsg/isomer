import { getACMCertificateValidationRecords } from "../utils/acm";
import { getSiteLaunchBatch } from "../utils/csv";
import {
  isDomainARecordsCorrect,
  isDomainCNAMERecordsCorrect,
  isDomainPointingToIndirectionLayer,
} from "../utils/dns";

interface VerifyDnsRecordsResult {
  repoName: string;
  domainName: string;
  acmRecordCorrect: boolean;
  isIndirectionLayerCorrect: boolean;
  isRedirectionRecordsCorrect: boolean;
}

export const verifyDnsRecords = async () => {
  console.log("Running script to verify DNS records...");
  const siteLaunchSites = await getSiteLaunchBatch();
  const result: VerifyDnsRecordsResult[] = [];

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

    result.push({
      repoName: site.repoName,
      domainName: site.isomerDomain,
      acmRecordCorrect: acmValidationRecord.isCorrect,
      isIndirectionLayerCorrect: isIndirectionCorrect.isCorrect,
      isRedirectionRecordsCorrect: isRedirectionCorrect.isCorrect,
    });
  }

  // Output the DNS verification results
  console.table(result);
};
