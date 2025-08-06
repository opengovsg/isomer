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
        contactMethodsContainer:
          "md:flex md:flex-1 md:flex-col lg:grid lg:grid-cols-2",
      },
      3: {
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

export const HomepageContactInformationUI = ({
  country: _country, // not actually used in the UI
  entityName,
  entityDetails,
  description,
  telephone,
  fax,
  email,
  website,
  operatingHours,
  otherMethods,
  referenceLinkHref,
  label,
  LinkComponent,
}: ContactInformationUIProps) => {
  const numberOfContactMethods =
    (entityDetails?.length ?? 0) +
    (telephone ? 1 : 0) +
    (fax ? 1 : 0) +
    (email ? 1 : 0) +
    (website ? 1 : 0) +
    (operatingHours ? 1 : 0) +
    (otherMethods?.length ?? 0)

  const compoundStyles = createHomepageContactInformationStyles({
    numberOfContactMethods: numberOfContactMethods >= 3 ? 3 : 2,
  })

  const contactMethodStyles = createHomepageContactMethodStyles({
    numberOfContactMethods: numberOfContactMethods >= 3 ? 3 : 2,
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

      {!!referenceLinkHref && !!label && renderButton({ isBottomButton: true })}
    </div>
  )
}
