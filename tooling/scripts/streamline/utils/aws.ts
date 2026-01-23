import {
  ACMClient,
  DeleteCertificateCommand,
  DescribeCertificateCommand,
  RequestCertificateCommand,
} from "@aws-sdk/client-acm";
import type { RequestCertificateCommandInput } from "@aws-sdk/client-acm";
import { fromSSO } from "@aws-sdk/credential-providers";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const getValidationRecordsWithRetry = async (
  client: ACMClient,
  certificateArn: string,
  maxRetries = 5,
  delayMs = 3000
) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const command = new DescribeCertificateCommand({
        CertificateArn: certificateArn,
      });

      const response = await client.send(command);

      if (!response.Certificate) {
        throw new Error("Certificate not found.");
      }

      const validationOptions = response.Certificate.DomainValidationOptions;

      if (!validationOptions || validationOptions.length === 0) {
        throw new Error("No domain validation options found.");
      }

      const records: ACMValidationRecord[] = validationOptions.map((option) => {
        if (!option.ResourceRecord?.Name || !option.ResourceRecord.Value) {
          throw new Error(
            "Incomplete resource record information for domain validation."
          );
        }

        return {
          name: option.ResourceRecord.Name,
          value: option.ResourceRecord.Value,
        };
      });

      return records;
    } catch (error) {
      attempt++;

      if (attempt >= maxRetries) {
        throw new Error(
          `Failed to describe certificate after ${maxRetries} attempts: ` +
            (error as Error).message
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

interface ACMValidationRecord {
  name: string;
  value: string;
}

export const getACMCertificateValidationRecords = async (domain: string) => {
  const client = new ACMClient({
    profile: process.env.AWS_NEXT_PROFILE,
    region: "us-east-1",
    credentials: fromSSO({
      profile: process.env.AWS_NEXT_PROFILE,
    }),
  });
  const requestCertificateCommandInput: RequestCertificateCommandInput = {
    DomainName: domain,
    ValidationMethod: "DNS",
    KeyAlgorithm: "RSA_2048",
    IdempotencyToken: domain.replace(/\./g, "_").replace(/-/g, "_"),
    Options: {
      CertificateTransparencyLoggingPreference: "ENABLED",
      Export: "DISABLED",
    },
    Tags: [
      {
        Key: "Source",
        Value: "TEMPORARY_FROM_STREAMLINE_SCRIPT",
      },
    ],
  };

  // NOTE: It is possible for this command to throw if we exceed the ACM request
  // rate limit. We will just let the error propagate in this case, as the limit
  // is on a per-hour basis and the user can only wait until the limit resets.
  const requestCertificateCommand = new RequestCertificateCommand(
    requestCertificateCommandInput
  );
  const response = await client.send(requestCertificateCommand);

  if (!response.CertificateArn) {
    throw new Error("Failed to request ACM certificate.");
  }

  // Wait for 3 seconds to ensure that the certificate details are available
  await new Promise((resolve) => setTimeout(resolve, 3 * 1000));

  const records = await getValidationRecordsWithRetry(
    client,
    response.CertificateArn
  );

  if (!records) {
    throw new Error("Failed to retrieve ACM certificate validation records.");
  }

  // Perform a cleanup by deleting the temporary certificate
  const deleteCertificateCommand = new DeleteCertificateCommand({
    CertificateArn: response.CertificateArn,
  });
  await client.send(deleteCertificateCommand);

  // NOTE: We assume only the first record, as we are only requesting the
  // certificate for a single domain without any SANs.
  return records[0];
};
