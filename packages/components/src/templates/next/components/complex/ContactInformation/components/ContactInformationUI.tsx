import DOMPurify from "isomorphic-dompurify"
import {
  BiGlobe,
  BiMailSend,
  BiPhone,
  BiPrinter,
  BiTimeFive,
} from "react-icons/bi"

import type { ContactInformationUIProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getTailwindVariantLayout } from "~/utils"
import { ComponentContent } from "../../../internal/customCssClass"
import { LinkButton } from "../../../internal/LinkButton"
import { ContactMethod } from "./ContactMethod"

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
          entityDetails.map((detail) => {
            return (
              <ContactMethod
                variant={simplifiedLayout}
                {...detail}
                LinkComponent={LinkComponent}
              />
            )
          })}

        {!!telephone && (
          <ContactMethod
            variant={simplifiedLayout}
            Icon={BiPhone}
            {...telephone}
            label={telephone.label ?? "Telephone"}
            LinkComponent={LinkComponent}
          />
        )}

        {!!fax && (
          <ContactMethod
            variant={simplifiedLayout}
            Icon={BiPrinter}
            {...fax}
            label={fax.label ?? "Fax"}
            LinkComponent={LinkComponent}
          />
        )}

        {!!email && (
          <ContactMethod
            variant={simplifiedLayout}
            Icon={BiMailSend}
            {...email}
            label={email.label ?? "Email"}
            LinkComponent={LinkComponent}
          />
        )}

        {!!website && (
          <ContactMethod
            variant={simplifiedLayout}
            Icon={BiGlobe}
            {...website}
            label={website.label ?? "Website"}
            LinkComponent={LinkComponent}
          />
        )}

        {!!operatingHours && (
          <ContactMethod
            variant={simplifiedLayout}
            Icon={BiTimeFive}
            {...operatingHours}
            label={operatingHours.label ?? "Operating Hours"}
            LinkComponent={LinkComponent}
          />
        )}

        {!!otherMethods &&
          otherMethods.length > 0 &&
          otherMethods.map((method) => {
            return (
              <ContactMethod
                variant={simplifiedLayout}
                {...method}
                LinkComponent={LinkComponent}
              />
            )
          })}
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
