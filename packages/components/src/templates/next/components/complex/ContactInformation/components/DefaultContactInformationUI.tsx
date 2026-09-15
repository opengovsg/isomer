import type { ContactInformationUIProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"

import {
  contentBlockIndexAttr,
  type ContentBlockIndexProps,
} from "../../../../render/contentBlockIndex"
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
  isLoading,
  acceptHtmlTags = false,
  headingLevel,
  contentBlockIndex,
}: ContactInformationUIProps & ContentBlockIndexProps) => {
  const compoundStyles = createDefaultContactInformationStyles({
    isLoading,
  })
  const contactMethodStyles = createDefaultContactMethodStyles({
    isLoading,
  })
  const hasTitle = !!title || isLoading
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

  const descriptionText = isLoading ? "" : (description ?? "")

  return (
    <section
      className={compoundStyles.screenWideOuterContainer()}
      {...contentBlockIndexAttr(contentBlockIndex)}
    >
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.titleAndDescriptionContainer()}>
          {(title || isLoading) && (
            <TitleTag className={compoundStyles.title()}>
              {isLoading ? "" : title}
            </TitleTag>
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
                    styles={contactMethodStyles}
                  />
                )
              })}
        </div>

        {!!otherInformation &&
          !!otherInformation.value &&
          otherInformation.value.trim() !== "" && (
            <div className={compoundStyles.otherInformationContainer()}>
              <OtherInformationTitleTag
                className={compoundStyles.otherInformationTitle()}
              >
                {otherInformation.label ?? "Other Information"}
              </OtherInformationTitleTag>
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
