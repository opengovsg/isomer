import fs from "node:fs"
import {
  ACMClient,
  DeleteCertificateCommand,
  DescribeCertificateCommand,
  RequestCertificateCommand,
} from "@aws-sdk/client-acm"

function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

const client = new ACMClient({ region: "us-east-1" })

export const describeAcmViaClient = async (certArn: string) => {
  // Step 2: Describe certificate to get DNS validation record
  const describeCommand = new DescribeCertificateCommand({
    CertificateArn: certArn,
  })

  const { Certificate } = await client.send(describeCommand)
  let resourceRecord = Certificate?.DomainValidationOptions?.[0]?.ResourceRecord

  // NOTE: wait until we get the resource record
  // there can be a delay of several seconds according to aws,
  // so we will just delay every 1s and recheck.
  // Don't throw or have upper limit because
  // users can terminate here without any issues
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/acm/command/RequestCertificateCommand
  while (!resourceRecord) {
    sleep(1)

    const { Certificate } = await client.send(describeCommand)
    resourceRecord = Certificate?.DomainValidationOptions?.[0]?.ResourceRecord
  }

  return resourceRecord
}

export const requestAcmViaClient = async (domain: string) => {
  // Step 1: Request certificate
  const requestCommand = new RequestCertificateCommand({
    DomainName: domain,
    ValidationMethod: "DNS",
  })

  const { CertificateArn: certArn } = await client.send(requestCommand)
  if (!certArn) {
    console.log(`Requested for cert for ${domain} but no certArn was returned`)
    // NOTE: cannot recover -> just throw an error, crash the program
    // then retry manually down the road
    throw new Error("No CertificateArn returned")
  }

  const {
    Name: _Name,
    Type,
    Value: _Value,
  } = await describeAcmViaClient(certArn)
  const Name = _Name?.slice(0, -1)
  const Value = _Value?.slice(0, -1)
  const opsRecord = `${Name}   ${Type}   ${Value}`

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
