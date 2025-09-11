import fs from "node:fs"
import {
  ACMClient,
  DeleteCertificateCommand,
  DescribeCertificateCommand,
  RequestCertificateCommand,
} from "@aws-sdk/client-acm"

export const requestAcmViaClient = async (domain: string) => {
  const client = new ACMClient({ region: "us-east-1" })

  // Step 1: Request certificate
  const requestCommand = new RequestCertificateCommand({
    DomainName: domain,
    ValidationMethod: "DNS",
  })

  const { CertificateArn: certArn } = await client.send(requestCommand)
  console.log(`ARN of created certificate: ${certArn}`)

  // Step 2: Describe certificate to get DNS validation record
  const describeCommand = new DescribeCertificateCommand({
    CertificateArn: certArn,
  })

  const { Certificate } = await client.send(describeCommand)
  const resourceRecord =
    Certificate?.DomainValidationOptions?.[0]?.ResourceRecord

  if (!resourceRecord) {
    throw new Error("No DNS validation record found")
  }

  const { Name: _Name, Type, Value: _Value } = resourceRecord
  const Name = _Name?.slice(0, -1)
  const Value = _Value?.slice(0, -1)
  console.log(`${Name}   ${Type}   ${Value}`)

  // Step 3: Write DNS record to file
  fs.writeFileSync(`./${domain}.ssl.conf`, `${Name}   ${Type}   ${Value}`)

  // Step 4: Delete certificate for cleanliness
  const deleteCommand = new DeleteCertificateCommand({
    CertificateArn: certArn,
  })

  await client.send(deleteCommand)
  console.log(`Deleted certificate with arn: ${certArn}`)

  return opsRecord
}
