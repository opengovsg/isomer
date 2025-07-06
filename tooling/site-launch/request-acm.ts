import fs from "node:fs"
import { confirm } from "@inquirer/prompts"
import { exec } from "utils"

export const requestAcm = async (domain: string) => {
  const needsAcm = await confirm({
    message: "Do you need to request an ACM certificate?",
  })

  if (needsAcm) {
    const { stdout: certArn } = await exec(
      `aws acm request-certificate --domain-name ${domain} --validation-method DNS --query "CertificateArn"`,
    )

    console.log(`ARN of created certificate: ${certArn}`)

    const cmd =
      `aws acm describe-certificate --certificate-arn ${certArn} --query 'Certificate.DomainValidationOptions | [0].ResourceRecord'`.replace(
        // NOTE: Replacing because when the `cmd` is too long,
        // there is a line break inserted
        "\n",
        " ",
      )

    // NOTE: This is an object with
    // Name, Type, Value
    const { stdout: rawCert } = await exec(cmd)

    const { Name, Type, Value } = JSON.parse(rawCert)
    console.log(`${Name}   ${Type}   ${Value}`)

    fs.writeFileSync(`./${domain}.ssl.conf`, `${Name}   ${Type}   ${Value}`)
    const canDelete = await confirm({
      message:
        "Have you copied down the cert configuration above and passed it to prodops?",
    })

    if (canDelete) {
      await exec(`aws acm delete-certificate --certificate-arn ${certArn}`)
      // NOTE: Leave file on disk as failsafe
      console.log(`Deleted certificate with arn: ${certArn}`)
    }
  }
}
