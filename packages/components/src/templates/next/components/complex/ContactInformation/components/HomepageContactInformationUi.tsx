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
  compoundVariants: [
    {
      class: {
        urlButtonContainer: "mt-10 hidden md:mx-0 md:block",
      },
      isBottomButton: false,
      numberOfContactMethods: 2,
    },
    {
      class: {
        urlButtonContainer: "block md:mx-0 md:hidden",
      },
      isBottomButton: true,
      numberOfContactMethods: 2,
    },
    {
      class: {
        urlButtonContainer: "hidden",
      },
      isBottomButton: false,
      numberOfContactMethods: 3,
    },
    {
      class: {
        urlButtonContainer: "block",
      },
      isBottomButton: true,
      numberOfContactMethods: 3,
    },
  ],
  extend: commonContactInformationStyles,
  slots: {
    ...commonContactInformationStyles.slots,
    contactMethodsContainer: "grid grid-cols-1 gap-10",
    container: "gap-12 py-12 md:py-16",
    description: "prose-headline-lg-regular",
    titleAndDescriptionContainer: "gap-2.5",
  },
  variants: {
    isBottomButton: {
      false: {},
      true: {},
    },
    numberOfContactMethods: {
      2: {
        contactMethodsContainer:
          "md:flex md:flex-1 md:flex-col lg:grid lg:grid-cols-2",
        container: "md:flex-row md:gap-10",
        titleAndDescriptionContainer: "max-w-[24.5rem]",
      },
      3: {
        contactMethodsContainer: "md:grid md:grid-cols-3",
        titleAndDescriptionContainer: "lg:max-w-3xl",
      },
    },
  },
})

const createHomepageContactMethodStyles = tv({
  extend: commonContactMethodStyles,
  variants: {
    numberOfContactMethods: {
      2: {},
      3: {
        container: "md:items-center",
        label: "md:text-center",
        textContainer: "md:items-center",
        value: "md:text-center",
        valuesAndCaptionContainer: "md:items-center",
      },
    },
  },
})

type NumberOfContactMethods =
  keyof typeof createHomepageContactMethodStyles.variants.numberOfContactMethods

const MAX_CONTACT_METHODS_FOR_HOMEPAGE = 3

const hasNonEmptyString = (value: string | undefined): boolean =>
  value !== undefined && value !== ""

const getNumberOfContactMethods = (
  isLoading: ContactInformationUIProps["isLoading"],
  filteredMethodsCount: number,
): NumberOfContactMethods => {
  if (isLoading === true) {
    return MAX_CONTACT_METHODS_FOR_HOMEPAGE
  }

  return filteredMethodsCount >= MAX_CONTACT_METHODS_FOR_HOMEPAGE
    ? MAX_CONTACT_METHODS_FOR_HOMEPAGE
    : 2
}

const CallToActionButton = ({
  referenceLinkHref,
  label,
  urlButtonContainerClassName,
}: {
  referenceLinkHref: string
  label: string
  urlButtonContainerClassName: string
}) => (
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

  const numberOfContactMethods = getNumberOfContactMethods(
    isLoading,
    filteredMethods.length,
  )

  const compoundStyles = createHomepageContactInformationStyles({
    isLoading,
    numberOfContactMethods,
  })

  const contactMethodStyles = createHomepageContactMethodStyles({
    isLoading,
    numberOfContactMethods,
  })

  const descriptionText = isLoading === true ? "" : (description ?? "")
  const showReferenceLink =
    hasNonEmptyString(referenceLinkHref) &&
    hasNonEmptyString(label) &&
    isLoading !== true

  return (
    <section className={compoundStyles.screenWideOuterContainer()}>
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.titleAndDescriptionContainer()}>
          {(hasNonEmptyString(title) || isLoading === true) && (
            <DynamicHeading
              level={headingLevel}
              className={compoundStyles.title()}
            >
              {isLoading === true ? "" : title}
            </DynamicHeading>
          )}
          {(hasNonEmptyString(description) || isLoading === true) &&
            (acceptHtmlTags ? (
              <BaseParagraph
                content={descriptionText}
                allowedTags={["br"]}
                className={compoundStyles.description()}
              />
            ) : (
              <p className={compoundStyles.description()}>{descriptionText}</p>
            ))}
          {showReferenceLink && (
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
          {isLoading === true
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
                .map((method) => (
                  <ContactMethod
                    key={`${method.method ?? "method"}-${method.values.join("-")}`}
                    {...method}
                    styles={contactMethodStyles}
                  />
                ))}
        </div>

        {showReferenceLink && (
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
