import type { ContactInformationUIProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { DynamicHeading } from "~/utils/DynamicHeading"

import { BaseParagraph } from "../../../internal/BaseParagraph"
import { LinkButton } from "../../../internal/LinkButton"
import {
  commonContactInformationStyles,
  commonContactMethodStyles,
} from "./common"
import { ContactMethod, LoadingContactMethod } from "./ContactMethod"
import { filterContactMethods } from "./filterContactMethods"

const createHomepageContactInformationStyles = tv({
  extend: commonContactInformationStyles,
  slots: {
    ...commonContactInformationStyles.slots,
    container: "gap-12 py-12 md:py-16",
    titleAndDescriptionContainer: "gap-2.5",
    description: "prose-headline-lg-regular",
    contactMethodsContainer: "grid grid-cols-1 gap-10",
  },
  variants: {
    numberOfContactMethods: {
      2: {
        container: "md:flex-row md:gap-10",
        titleAndDescriptionContainer: "max-w-[24.5rem]",
        contactMethodsContainer:
          "md:flex md:flex-1 md:flex-col lg:grid lg:grid-cols-2",
      },
      3: {
        titleAndDescriptionContainer: "lg:max-w-3xl",
        contactMethodsContainer: "md:grid md:grid-cols-3",
      },
    },
    isBottomButton: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      numberOfContactMethods: 2,
      isBottomButton: false,
      class: {
        urlButtonContainer: "mt-10 hidden md:mx-0 md:block",
      },
    },
    {
      numberOfContactMethods: 2,
      isBottomButton: true,
      class: {
        urlButtonContainer: "block md:mx-0 md:hidden",
      },
    },
    {
      numberOfContactMethods: 3,
      isBottomButton: false,
      class: {
        urlButtonContainer: "hidden",
      },
    },
    {
      numberOfContactMethods: 3,
      isBottomButton: true,
      class: {
        urlButtonContainer: "block",
      },
    },
  ],
})

const createHomepageContactMethodStyles = tv({
  extend: commonContactMethodStyles,
  variants: {
    numberOfContactMethods: {
      2: {},
      3: {
        container: "md:items-center",
        textContainer: "md:items-center",
        label: "md:text-center",
        valuesAndCaptionContainer: "md:items-center",
        value: "md:text-center",
      },
    },
  },
})

type NumberOfContactMethods =
  keyof typeof createHomepageContactMethodStyles.variants.numberOfContactMethods

const MAX_CONTACT_METHODS_FOR_HOMEPAGE = 3

const CallToActionButton = ({
  referenceLinkHref,
  label,
  urlButtonContainerClassName,
}: {
  referenceLinkHref: string
  label: string
  urlButtonContainerClassName: string
}) => {
  return (
    <div className={urlButtonContainerClassName}>
      <LinkButton
        href={referenceLinkHref}
        size="base"
        variant="outline"
        isWithFocusVisibleHighlight
      >
        {label}
      </LinkButton>
    </div>
  )
}

export const HomepageContactInformationUI = ({
  whitelistedMethods,
  title,
  description,
  methods,
  referenceLinkHref,
  label,
  isLoading,
  acceptHtmlTags = false,
  headingLevel,
}: ContactInformationUIProps) => {
  const filteredMethods = filterContactMethods({ methods, whitelistedMethods })

  const numberOfContactMethods: NumberOfContactMethods = isLoading
    ? MAX_CONTACT_METHODS_FOR_HOMEPAGE
    : filteredMethods.length >= MAX_CONTACT_METHODS_FOR_HOMEPAGE
      ? MAX_CONTACT_METHODS_FOR_HOMEPAGE
      : 2

  const compoundStyles = createHomepageContactInformationStyles({
    numberOfContactMethods,
    isLoading,
  })

  const contactMethodStyles = createHomepageContactMethodStyles({
    numberOfContactMethods,
    isLoading,
  })

  const descriptionText = isLoading ? "" : (description ?? "")

  return (
    <section className={compoundStyles.screenWideOuterContainer()}>
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.titleAndDescriptionContainer()}>
          {(title || isLoading) && (
            <DynamicHeading
              level={headingLevel}
              className={compoundStyles.title()}
            >
              {isLoading ? "" : title}
            </DynamicHeading>
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
          {!!referenceLinkHref && !!label && !isLoading && (
            <CallToActionButton
              referenceLinkHref={referenceLinkHref}
              label={label}
              urlButtonContainerClassName={compoundStyles.urlButtonContainer({
                isBottomButton: false,
              })}
            />
          )}
        </div>

        <div className={compoundStyles.contactMethodsContainer()}>
          {isLoading
            ? Array.from({ length: MAX_CONTACT_METHODS_FOR_HOMEPAGE }).map(
                (_, index) => (
                  <LoadingContactMethod
                    key={`loading-contact-method-${index}`}
                    styles={contactMethodStyles}
                  />
                ),
              )
            : filteredMethods
                .slice(0, MAX_CONTACT_METHODS_FOR_HOMEPAGE)
                .map((method) => {
                  return (
                    <ContactMethod
                      key={`${method.method ?? "method"}-${method.values.join("-")}`}
                      {...method}
                      styles={contactMethodStyles}
                    />
                  )
                })}
        </div>

        {!!referenceLinkHref && !!label && !isLoading && (
          <CallToActionButton
            referenceLinkHref={referenceLinkHref}
            label={label}
            urlButtonContainerClassName={compoundStyles.urlButtonContainer({
              isBottomButton: true,
            })}
          />
        )}
      </div>
    </section>
  )
}
