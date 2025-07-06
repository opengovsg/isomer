import fs from "node:fs"
import {
  ACMClient,
  DeleteCertificateCommand,
  DescribeCertificateCommand,
  RequestCertificateCommand,
} from "@aws-sdk/client-acm"
import { confirm } from "@inquirer/prompts"
import { exec } from "utils"

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

  const { Name, Type, Value } = resourceRecord
  console.log(`${Name}   ${Type}   ${Value}`)

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
}
