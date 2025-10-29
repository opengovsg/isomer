import type { ContactInformationUIProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { BaseParagraph } from "../../../internal"
import { LinkButton } from "../../../internal/LinkButton"
import {
  commonContactInformationStyles,
  commonContactMethodStyles,
} from "./common"
import { ContactMethod, LoadingContactMethod } from "./ContactMethod"
import { filterContactMethods } from "./filterContactMethods"

const createDefaultContactInformationStyles = tv({
  extend: commonContactInformationStyles,
  slots: {
    screenWideOuterContainer: "mt-12 first:mt-0",
    container: "gap-9",
    titleAndDescriptionContainer: "gap-6 lg:max-w-3xl",
    description: "prose-body-base",
    contactMethodsContainer: "md:grid md:grid-cols-2",
    urlButtonContainer: "block",
  },
})

const createDefaultContactMethodStyles = tv({
  extend: commonContactMethodStyles,
})

export const DefaultContactInformationUI = ({
  whitelistedMethods,
  title,
  description,
  methods,
  otherInformation,
  referenceLinkHref,
  label,
  LinkComponent,
  isLoading,
  acceptHtmlTags = false,
}: ContactInformationUIProps) => {
  const compoundStyles = createDefaultContactInformationStyles({
    isLoading,
  })
  const contactMethodStyles = createDefaultContactMethodStyles({
    isLoading,
  })

  const filteredMethods = filterContactMethods({
    methods,
    whitelistedMethods,
  })

  const descriptionText = isLoading ? "" : (description ?? "")

  return (
    <section className={compoundStyles.screenWideOuterContainer()}>
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.titleAndDescriptionContainer()}>
          {(title || isLoading) && (
            <h2 className={compoundStyles.title()}>{isLoading ? "" : title}</h2>
          )}
          {(!!description || isLoading) &&
            (acceptHtmlTags ? (
              <BaseParagraph
                content={descriptionText}
                allowedTags={["br"]}
                className={compoundStyles.description()}
              />
            ) : (
              <p className={compoundStyles.description()}>{descriptionText}</p>
            ))}
        </div>

        <div className={compoundStyles.contactMethodsContainer()}>
          {isLoading
            ? Array(4)
                .fill(null)
                .map((_, index) => (
                  <LoadingContactMethod
                    key={`loading-contact-method-${index}`}
                    styles={contactMethodStyles}
                  />
                ))
            : filteredMethods.map((method, index) => {
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

        {!!otherInformation &&
          !!otherInformation.value &&
          otherInformation.value.trim() !== "" && (
            <div className={compoundStyles.otherInformationContainer()}>
              <h3 className={compoundStyles.otherInformationTitle()}>
                {otherInformation.label ?? "Other Information"}
              </h3>
              {acceptHtmlTags ? (
                <BaseParagraph
                  content={otherInformation.value}
                  allowedTags={["b"]}
                />
              ) : (
                <div>{otherInformation.value}</div>
              )}
            </div>
          )}

        {!!referenceLinkHref && !!label && !isLoading && (
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
    </section>
  )
}
