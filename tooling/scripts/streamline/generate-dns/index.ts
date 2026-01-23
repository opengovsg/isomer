import { getACMCertificateValidationRecords } from "../utils/aws";
import { getOnboardingBatch } from "../utils/csv";
import {
  isDomainARecordsCorrect,
  isDomainPointingToIndirectionLayer,
} from "../utils/dns";

export const generateDnsRecords = async () => {
  console.log("Running script to generate DNS records...");
  const onboardingSites = await getOnboardingBatch();

  for (const site of onboardingSites) {
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

    // Step 4: Output the DNS updates required
    // TODO: Improve output format
    console.log("DNS Record to add:");
    console.log(`- Name: ${record.name}`);
    console.log(`- Value: ${record.value}`);
    console.log(
      `- Indirection Layer Update Needed: ${
        isIndirectionCorrect.isCorrect ? "No" : "Yes"
      }`
    );
    console.log(
      `- Redirection Domain Update Needed: ${
        isRedirectionCorrect.isCorrect ? "No" : "Yes"
      }`
    );
    console.log("---------------------------------------------------");
  }
};
