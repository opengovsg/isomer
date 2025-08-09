import DOMPurify from "isomorphic-dompurify"

import type { ContactInformationUIProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { LinkButton } from "../../../internal/LinkButton"
import {
  commonContactInformationStyles,
  commonContactMethodStyles,
} from "./common"
import { ContactMethod } from "./ContactMethod"

const createDefaultContactInformationStyles = tv({
  extend: commonContactInformationStyles,
  slots: {
    container: "gap-9 py-12",
    titleAndDescriptionContainer: "lg:max-w-3xl",
    contactMethodsContainer: "md:grid md:grid-cols-2",
    urlButtonContainer: "block",
  },
})

const createDefaultContactMethodStyles = tv({
  extend: commonContactMethodStyles,
})

export const DefaultContactInformationUI = ({
  entityName,
  description,
  methods,
  otherInformation,
  referenceLinkHref,
  label,
  LinkComponent,
}: ContactInformationUIProps) => {
  const compoundStyles = createDefaultContactInformationStyles()
  const contactMethodStyles = createDefaultContactMethodStyles()

  return (
    <div className={compoundStyles.container()}>
      <div className={compoundStyles.titleAndDescriptionContainer()}>
        {entityName && <h3 className={compoundStyles.title()}>{entityName}</h3>}
        {!!description && (
          <p className={compoundStyles.description()}>{description}</p>
        )}
      </div>

      <div className={compoundStyles.contactMethodsContainer()}>
        {methods.map((method, index) => {
          return (
            <ContactMethod
              key={`contact-method-${index}`}
              {...method}
              LinkComponent={LinkComponent}
              styles={contactMethodStyles}
            />
          )
        })}
      </div>

      {!!otherInformation && (
        <div className={compoundStyles.otherInformationContainer()}>
          <div className={compoundStyles.otherInformationTitle()}>
            {otherInformation.label ?? "Other Information"}
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(otherInformation.value, {
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
