import type { ContactInformationUIProps } from "~/interfaces"
import { createElement } from "react"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"

import { BaseParagraph } from "../../../internal/BaseParagraph"
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
    contactMethodsContainer: "md:grid md:grid-cols-2",
    container: "gap-9",
    description: "prose-body-base",
    screenWideOuterContainer: "mt-12 first:mt-0",
    titleAndDescriptionContainer: "gap-6 lg:max-w-3xl",
    urlButtonContainer: "block",
  },
})

const createDefaultContactMethodStyles = tv({
  extend: commonContactMethodStyles,
})

const hasNonEmptyString = (value: string | undefined): boolean =>
  value !== undefined && value !== ""

const renderDescription = ({
  acceptHtmlTags,
  descriptionText,
  descriptionClassName,
}: {
  acceptHtmlTags: boolean
  descriptionText: string
  descriptionClassName: string
}) => {
  if (acceptHtmlTags) {
    return (
      <BaseParagraph
        content={descriptionText}
        allowedTags={["br"]}
        className={descriptionClassName}
      />
    )
  }

  return <p className={descriptionClassName}>{descriptionText}</p>
}

const renderOtherInformation = ({
  acceptHtmlTags,
  otherInformation,
  styles,
  OtherInformationTitleTag,
}: {
  acceptHtmlTags: boolean
  otherInformation: NonNullable<ContactInformationUIProps["otherInformation"]>
  styles: ReturnType<typeof createDefaultContactInformationStyles>
  OtherInformationTitleTag: ReturnType<typeof getHeadingTag>
}) => (
  <div className={styles.otherInformationContainer()}>
    {createElement(
      OtherInformationTitleTag,
      { className: styles.otherInformationTitle() },
      otherInformation.label ?? "Other Information",
    )}
    {acceptHtmlTags ? (
      <BaseParagraph content={otherInformation.value} allowedTags={["b"]} />
    ) : (
      <div>{otherInformation.value}</div>
    )}
  </div>
)

export const DefaultContactInformationUI = ({
  whitelistedMethods,
  title,
  description,
  methods,
  otherInformation,
  referenceLinkHref,
  label,
  isLoading,
  acceptHtmlTags = false,
  headingLevel,
}: ContactInformationUIProps) => {
  const compoundStyles = createDefaultContactInformationStyles({
    isLoading,
  })
  const contactMethodStyles = createDefaultContactMethodStyles({
    isLoading,
  })
  const hasTitle = hasNonEmptyString(title) || isLoading === true
  const TitleTag = getHeadingTag(headingLevel)
  // "Other Information" only nests one level deeper than the title if the
  // title actually renders — otherwise it would be a heading with no parent
  // heading in between, skipping a level.
  const OtherInformationTitleTag = getHeadingTag(
    hasTitle ? headingLevel + 1 : headingLevel,
  )

  const filteredMethods = filterContactMethods({
    methods,
    whitelistedMethods,
  })

  const descriptionText = isLoading === true ? "" : (description ?? "")
  const showDescription = hasNonEmptyString(description) || isLoading === true
  const showReferenceLink =
    hasNonEmptyString(referenceLinkHref) &&
    hasNonEmptyString(label) &&
    isLoading !== true
  const showOtherInformation =
    otherInformation !== undefined && hasNonEmptyString(otherInformation.value)

  return (
    <section className={compoundStyles.screenWideOuterContainer()}>
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.titleAndDescriptionContainer()}>
          {(hasNonEmptyString(title) || isLoading === true) &&
            createElement(
              TitleTag,
              { className: compoundStyles.title() },
              isLoading === true ? "" : title,
            )}
          {showDescription &&
            renderDescription({
              acceptHtmlTags,
              descriptionClassName: compoundStyles.description(),
              descriptionText,
            })}
        </div>

        <div className={compoundStyles.contactMethodsContainer()}>
          {isLoading === true
            ? Array.from({ length: 4 }).map((_, index) => (
                <LoadingContactMethod
                  key={`loading-contact-method-${index}`}
                  styles={contactMethodStyles}
                />
              ))
            : filteredMethods.map((method) => (
                <ContactMethod
                  key={`${method.method ?? "method"}-${method.values.join("-")}`}
                  {...method}
                  styles={contactMethodStyles}
                />
              ))}
        </div>

        {showOtherInformation &&
          renderOtherInformation({
            OtherInformationTitleTag,
            acceptHtmlTags,
            otherInformation,
            styles: compoundStyles,
          })}

        {showReferenceLink && (
          <div className={compoundStyles.urlButtonContainer()}>
            <LinkButton
              href={referenceLinkHref}
              size="base"
              variant="outline"
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
