import DOMPurify from "isomorphic-dompurify"

import type {
  ContactInformationUIProps,
  SingleContactInformationProps,
} from "~/interfaces"
import { tv } from "~/lib/tv"
import { getTailwindVariantLayout } from "~/utils"
import { ComponentContent } from "../../../internal/customCssClass"
import { LinkButton } from "../../../internal/LinkButton"
import { ContactMethod } from "./ContactMethod"
import { METHODS_MAPPING } from "./mapping"

const createContactInformationStyles = tv({
  slots: {
    container: `${ComponentContent} flex flex-col`,
    titleAndDescriptionContainer: "flex flex-col gap-2",
    title: "prose-display-md font-bold text-base-content-strong",
    description: "prose-headline-lg-regular text-base-content-strong",
    contactMethodsContainer: "flex flex-col gap-4",
    otherInformationContainer: "mt-8 flex flex-col gap-6",
    otherInformationTitle:
      "prose-display-md font-bold text-base-content-strong",
    urlButtonContainer: "mx-auto block",
  },
  variants: {
    layout: {
      homepage: {
        container: "gap-12 py-12 md:py-16",
        contactMethodsContainer: "grid grid-cols-1 gap-10 md:grid-cols-3",
      },
      default: {
        container: "gap-9 py-12",
        contactMethodsContainer: "grid grid-cols-1 gap-10 md:grid-cols-2",
      },
    },
  },
  defaultVariants: {
    layout: "default",
  },
})

export const ContactInformationUI = ({
  layout,
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
  otherInformation,
  referenceLinkHref,
  label,
  LinkComponent,
}: ContactInformationUIProps) => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const variants = {
    layout: simplifiedLayout,
  } as const
  const compoundStyles = createContactInformationStyles(variants)

  const renderContactMethod = (
    methodKey?: keyof typeof METHODS_MAPPING,
    method?: SingleContactInformationProps,
  ) => {
    if (!method) return null

    const methodMapping = methodKey ? METHODS_MAPPING[methodKey] : undefined
    return (
      <ContactMethod
        variant={simplifiedLayout}
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

      {simplifiedLayout === "default" && !!otherInformation && (
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
