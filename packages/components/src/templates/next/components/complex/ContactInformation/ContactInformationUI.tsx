import DOMPurify from "isomorphic-dompurify"

import type { ContactInformationUIProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Link } from "~/templates/next/components/internal/Link"
import { isEmail, isExternalUrl, isUrl } from "~/utils"

const createContactInformationStyles = tv({
  slots: {
    container: "flex flex-col gap-4",
    title: "prose-display-md font-bold text-base-content-strong",
    description: "prose-body-md text-base-content",
    contactMethod: "flex w-fit flex-col",
    contactMethodDisplayText:
      "prose-body-base font-bold text-base-content-strong",
    contactMethodValue: "prose-body-base flex flex-col text-base-content",
    contactMethodValueLink:
      "w-fit text-base-content underline hover:text-base-content-strong",
  },
})

const compoundStyles = createContactInformationStyles()

interface ContactMethod {
  displayText: string
  values: string[]
  LinkComponent: ContactInformationUIProps["LinkComponent"]
}
const renderContactMethod = ({
  displayText,
  values,
  LinkComponent,
}: ContactMethod) => {
  return (
    <div className={compoundStyles.contactMethod()}>
      <div className={compoundStyles.contactMethodDisplayText()}>
        {displayText}
      </div>
      {values.map((value) => {
        if (isUrl(value)) {
          const isExternalLink = isExternalUrl(value)
          return (
            <Link
              href={value}
              isExternal={isExternalLink}
              showExternalIcon={isExternalLink}
              LinkComponent={LinkComponent}
              className={compoundStyles.contactMethodValueLink()}
            >
              {value}
            </Link>
          )
        }
        if (isEmail(value)) {
          return (
            <Link
              href={`mailto:${value}`}
              className={compoundStyles.contactMethodValueLink()}
            >
              {value}
            </Link>
          )
        }
        return (
          <div className={compoundStyles.contactMethodValue()}>{value}</div>
        )
      })}
    </div>
  )
}

export const ContactInformationUI = ({
  country,
  city,
  entityDetails,
  description,
  telephone,
  fax,
  email,
  website,
  operatingHours,
  otherMethods,
  otherInformation,
  LinkComponent,
}: ContactInformationUIProps) => {
  return (
    <div className={compoundStyles.container()}>
      <h3 className={compoundStyles.title()}>
        {country} - {city}
      </h3>
      <p className={compoundStyles.description()}>{description}</p>

      {!!entityDetails &&
        entityDetails.length > 0 &&
        entityDetails.map((detail) => {
          return renderContactMethod({ ...detail, LinkComponent })
        })}

      {!!telephone &&
        renderContactMethod({
          displayText: telephone.displayText ?? "Telephone",
          values: telephone.values,
          LinkComponent,
        })}

      {!!fax &&
        renderContactMethod({
          displayText: fax.displayText ?? "Fax",
          values: fax.values,
          LinkComponent,
        })}

      {!!email &&
        renderContactMethod({
          displayText: email.displayText ?? "Email",
          values: email.values,
          LinkComponent,
        })}

      {!!website &&
        renderContactMethod({
          displayText: website.displayText ?? "Website",
          values: website.values,
          LinkComponent,
        })}

      {!!operatingHours &&
        renderContactMethod({
          displayText: operatingHours.displayText ?? "Operating Hours",
          values: operatingHours.values,
          LinkComponent,
        })}

      {!!otherMethods &&
        otherMethods.length > 0 &&
        otherMethods.map((method) => {
          return renderContactMethod({ ...method, LinkComponent })
        })}

      {!!otherInformation && (
        <div className={compoundStyles.contactMethod()}>
          <div className={compoundStyles.contactMethodDisplayText()}>
            Other Information
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(otherInformation, {
                ALLOWED_TAGS: ["b"],
              }),
            }}
          />
        </div>
      )}
    </div>
  )
}
