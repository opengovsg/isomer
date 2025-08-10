import type { ContactInformationUIProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { LinkButton } from "../../../internal/LinkButton"
import {
  commonContactInformationStyles,
  commonContactMethodStyles,
} from "./common"
import { ContactMethod } from "./ContactMethod"

const createHomepageContactInformationStyles = tv({
  extend: commonContactInformationStyles,
  slots: {
    ...commonContactInformationStyles.slots,
    container: "gap-12 py-12 md:py-16",
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

const MAX_CONTACT_METHODS_FOR_HOMEPAGE = 3

export const HomepageContactInformationUI = ({
  whitelistedMethods,
  entityName,
  description,
  methods,
  referenceLinkHref,
  label,
  LinkComponent,
}: ContactInformationUIProps) => {
  const filteredMethods = whitelistedMethods
    ? methods.filter(
        (method) => method.method && whitelistedMethods.includes(method.method),
      )
    : methods

  const compoundStyles = createHomepageContactInformationStyles({
    numberOfContactMethods:
      filteredMethods.length >= MAX_CONTACT_METHODS_FOR_HOMEPAGE
        ? MAX_CONTACT_METHODS_FOR_HOMEPAGE
        : 2,
  })

  const contactMethodStyles = createHomepageContactMethodStyles({
    numberOfContactMethods:
      filteredMethods.length >= MAX_CONTACT_METHODS_FOR_HOMEPAGE
        ? MAX_CONTACT_METHODS_FOR_HOMEPAGE
        : 2,
  })

  const CallToActionButton = ({
    isBottomButton,
  }: {
    isBottomButton: boolean
  }) => {
    return (
      <div
        className={compoundStyles.urlButtonContainer({
          isBottomButton,
        })}
      >
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
    )
  }

  return (
    <div className={compoundStyles.container()}>
      <div className={compoundStyles.titleAndDescriptionContainer()}>
        {entityName && <h3 className={compoundStyles.title()}>{entityName}</h3>}
        {!!description && (
          <p className={compoundStyles.description()}>{description}</p>
        )}
        {!!referenceLinkHref && !!label && (
          <CallToActionButton isBottomButton={false} />
        )}
      </div>

      <div className={compoundStyles.contactMethodsContainer()}>
        {filteredMethods
          .slice(0, MAX_CONTACT_METHODS_FOR_HOMEPAGE)
          .map((method, index) => {
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

      {!!referenceLinkHref && !!label && (
        <CallToActionButton isBottomButton={true} />
      )}
    </div>
  )
}
