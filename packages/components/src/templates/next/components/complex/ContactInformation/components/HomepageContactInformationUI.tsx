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
  entityName,
  entityDetails,
  description,
  telephone,
  fax,
  email,
  website,
  emergencyContact,
  operatingHours,
  otherMethods,
  referenceLinkHref,
  label,
  LinkComponent,
}: ContactInformationUIProps) => {
  // Create a mapping of methods to their keys for proper rendering
  // Note: ordering is important here, as it determines the order of the methods in the UI
  const allMethods = [
    ...(entityDetails ?? []).map((detail) => ({
      method: detail,
      key: undefined,
    })),
    { method: telephone, key: "telephone" as const },
    { method: fax, key: "fax" as const },
    { method: email, key: "email" as const },
    { method: website, key: "website" as const },
    { method: emergencyContact, key: "emergencyContact" as const },
    { method: operatingHours, key: "operatingHours" as const },
    ...(otherMethods ?? []).map((method) => ({ method, key: undefined })),
  ].filter(({ method }) => method) // Filter out undefined methods

  const compoundStyles = createHomepageContactInformationStyles({
    numberOfContactMethods:
      allMethods.length >= MAX_CONTACT_METHODS_FOR_HOMEPAGE
        ? MAX_CONTACT_METHODS_FOR_HOMEPAGE
        : 2,
  })

  const contactMethodStyles = createHomepageContactMethodStyles({
    numberOfContactMethods:
      allMethods.length >= MAX_CONTACT_METHODS_FOR_HOMEPAGE
        ? MAX_CONTACT_METHODS_FOR_HOMEPAGE
        : 2,
  })

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
        iconColor={methodMapping?.color}
      />
    )
  }

  const renderButton = ({ isBottomButton }: { isBottomButton: boolean }) => {
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
        {!!referenceLinkHref &&
          !!label &&
          renderButton({ isBottomButton: false })}
      </div>

      <div className={compoundStyles.contactMethodsContainer()}>
        {allMethods
          .slice(0, MAX_CONTACT_METHODS_FOR_HOMEPAGE)
          .map(({ method, key }) => renderContactMethod(key, method))}
      </div>

      {!!referenceLinkHref && !!label && renderButton({ isBottomButton: true })}
    </div>
  )
}
