import pick from "lodash/pick"

import type {
  DgsContactInformationProps,
  NativeContactInformationProps,
} from "~/interfaces/complex/ContactInformation"
import { transformDgsField, useDgsData } from "~/hooks/useDgsData"
import { ContactInformationUI } from "./ContactInformationUI"

export const DgsContactInformation = ({
  dataSource: { resourceId, row },
  ...rest
}: DgsContactInformationProps) => {
  const { record, isLoading, isError } = useDgsData({ resourceId, row })

  // TODO: better handling of these non-success states
  // will check with SY for design
  if (isLoading || isError || !record) {
    return <div>Loading...</div>
  }

  const country = transformDgsField(rest.country, record)

  const entityName = transformDgsField(rest.entityName, record)

  const description = transformDgsField(rest.description, record)

  const otherInformation = transformDgsField(rest.otherInformation, record)

  const telephone = rest.telephone
    ? (JSON.parse(
        transformDgsField(rest.telephone, record),
      ) as NativeContactInformationProps["telephone"])
    : undefined

  const fax = rest.fax
    ? (JSON.parse(
        transformDgsField(rest.fax, record),
      ) as NativeContactInformationProps["fax"])
    : undefined

  const email = rest.email
    ? (JSON.parse(
        transformDgsField(rest.email, record),
      ) as NativeContactInformationProps["email"])
    : undefined

  const website = rest.website
    ? (JSON.parse(
        transformDgsField(rest.website, record),
      ) as NativeContactInformationProps["website"])
    : undefined

  const operatingHours = rest.operatingHours
    ? (JSON.parse(
        transformDgsField(rest.operatingHours, record),
      ) as NativeContactInformationProps["operatingHours"])
    : undefined

  const entityDetails = rest.entityDetails
    ? (JSON.parse(
        transformDgsField(rest.entityDetails, record),
      ) as NativeContactInformationProps["entityDetails"])
    : undefined

  return (
    <ContactInformationUI
      country={country}
      entityName={entityName}
      description={description}
      telephone={telephone}
      fax={fax}
      email={email}
      website={website}
      operatingHours={operatingHours}
      entityDetails={entityDetails}
      otherInformation={otherInformation}
      {...pick(rest, "type", "layout", "site", "LinkComponent")}
    />
  )
}
