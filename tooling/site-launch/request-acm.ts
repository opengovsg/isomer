import fs from "node:fs"
import {
  ACMClient,
  DeleteCertificateCommand,
  DescribeCertificateCommand,
  RequestCertificateCommand,
} from "@aws-sdk/client-acm"
import { confirm } from "@inquirer/prompts"
import { Steps, toStateFile } from "state"
import { exec } from "utils"

function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

const client = new ACMClient({ region: "us-east-1" })

export const requestAcm = async (domain: string) => {
  const { stdout: certArn } = await exec(
    `aws acm request-certificate --domain-name ${domain} --validation-method DNS --query "CertificateArn" --region "us-east-1"`,
  )

  console.log(`ARN of created certificate: ${certArn}`)

  const cmd =
    `aws acm describe-certificate --certificate-arn ${certArn} --query 'Certificate.DomainValidationOptions | [0].ResourceRecord' --region "us-east-1"`.replace(
      // NOTE: Replacing because when the `cmd` is too long,
      // there is a line break inserted
      "\n",
      "",
    )

  // NOTE: This is an object with
  // Name, Type, Value
  const { stdout: rawCert } = await exec(cmd)

  // NOTE: sleep for 1s so records are confirm generated
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const { Name, Type, Value } = JSON.parse(rawCert)
  console.log(`${Name}   ${Type}   ${Value}`)

  fs.writeFileSync(`./${domain}.ssl.conf`, `${Name}   ${Type}   ${Value}`)
  const canDelete = await confirm({
    message:
      "Have you copied down the cert configuration above and passed it to prodops?",
  })

  if (canDelete) {
    await exec(
      `aws acm delete-certificate --certificate-arn ${certArn} --region "us-east-1"`,
    )
    // NOTE: Leave file on disk as failsafe
    console.log(`Deleted certificate with arn: ${certArn}`)
  }
}

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

  console.log(`ARN of created certificate: ${certArn}`)
  await toStateFile(domain, Steps.Acm, async () => certArn)

  const { Name, Type, Value } = await describeAcmViaClient(certArn)
  const opsRecord = `${Name}   ${Type}   ${Value}`
  console.log(opsRecord)

  // Step 3: Write DNS record to file
  fs.writeFileSync(`./${domain}.ssl.conf`, `${Name}   ${Type}   ${Value}`)

  // Step 4: Confirm with user and delete certificate if confirmed
  const canDelete = await confirm({
    message:
      "Have you copied down the cert configuration above and passed it to prodops?",
  })

  if (canDelete) {
    const deleteCommand = new DeleteCertificateCommand({
      CertificateArn: certArn,
    })

    await client.send(deleteCommand)
    console.log(`Deleted certificate with arn: ${certArn}`)
  }

  return opsRecord
}
