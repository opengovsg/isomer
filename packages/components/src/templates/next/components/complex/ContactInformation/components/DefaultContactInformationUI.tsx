import DOMPurify from "isomorphic-dompurify"

import type {
  ContactInformationUIProps,
  SingleContactInformationProps,
} from "~/interfaces"
import { tv } from "~/lib/tv"
import { LinkButton } from "../../../internal/LinkButton"
import {
  commonContactInformationStyles,
  commonContactMethodStyles,
} from "./common"
import { ContactMethod } from "./ContactMethod"
import { METHODS_MAPPING } from "./mapping"

const createDefaultContactInformationStyles = tv({
  extend: commonContactInformationStyles,
  slots: {
    container: "gap-9 py-12",
    contactMethodsContainer: "md:grid md:grid-cols-2",
    urlButtonContainer: "block",
  },
})

const createDefaultContactMethodStyles = tv({
  extend: commonContactMethodStyles,
})

export const DefaultContactInformationUI = ({
  entityName,
  entityDetails,
  description,
  telephone,
  fax,
  email,
  website,
  operatingHours,
  otherMethods,
  otherInformation,
  referenceLinkHref,
  label,
  LinkComponent,
}: ContactInformationUIProps) => {
  const compoundStyles = createDefaultContactInformationStyles()
  const contactMethodStyles = createDefaultContactMethodStyles()

  const renderContactMethod = (
    methodKey?: keyof typeof METHODS_MAPPING,
    method?: SingleContactInformationProps,
  ) => {
    if (!method) return null

    const methodMapping = methodKey ? METHODS_MAPPING[methodKey] : undefined
    return (
      <ContactMethod
        styles={contactMethodStyles}
        {...method}
        label={
          methodMapping ? (method.label ?? methodMapping.label) : method.label
        }
        Icon={methodMapping?.Icon}
        LinkComponent={LinkComponent}
      />
    )
  }

  return (
    <div className={compoundStyles.container()}>
      <div className={compoundStyles.titleAndDescriptionContainer()}>
        {entityName && <h3 className={compoundStyles.title()}>{entityName}</h3>}
        {!!description && (
          <p className={compoundStyles.description()}>{description}</p>
        )}
      </div>

      <div className={compoundStyles.contactMethodsContainer()}>
        {!!entityDetails &&
          entityDetails.length > 0 &&
          entityDetails.map((detail) => renderContactMethod(undefined, detail))}

        {renderContactMethod("telephone", telephone)}
        {renderContactMethod("fax", fax)}
        {renderContactMethod("email", email)}
        {renderContactMethod("website", website)}
        {renderContactMethod("operatingHours", operatingHours)}

        {!!otherMethods &&
          otherMethods.length > 0 &&
          otherMethods.map((method) => renderContactMethod(undefined, method))}
      </div>

      {!!otherInformation && (
        <div className={compoundStyles.otherInformationContainer()}>
          <div className={compoundStyles.otherInformationTitle()}>
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

      {!!referenceLinkHref && !!label && (
        <div className={compoundStyles.urlButtonContainer()}>
          <LinkButton
            href={referenceLinkHref}
            size="base"
            variant="outline"
            LinkComponent={LinkComponent}
            isWithFocusVisibleHighlight
          >
            {label}
          </LinkButton>
        </div>
      )}
    </div>
  )
}
