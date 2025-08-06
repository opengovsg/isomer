import { useMemo } from "react"
import omit from "lodash/omit"

import type {
  DgsApiDatasetSearchParams,
  DgsApiDatasetSearchResponseSuccess,
} from "~/hooks/useDgsData/types"
import type {
  DgsContactInformationProps,
  NativeContactInformationProps,
} from "~/interfaces/complex/ContactInformation"
import { transformDgsField, useDgsData } from "~/hooks/useDgsData"
import { safeJsonParse } from "~/utils"
import { ContactInformationUI } from "./ContactInformationUI"

export const DgsContactInformation = ({
  dataSource: { resourceId, filters },
  ...rest
}: DgsContactInformationProps) => {
  const params = useMemo(
    () => ({
      resourceId,
      filters: filters?.reduce(
        (acc, filter) => {
          acc[filter.fieldKey] = filter.fieldValue
          return acc
        },
        {} as NonNullable<DgsApiDatasetSearchParams["filters"]>,
      ),
    }),
    [resourceId, filters],
  )

  const { records, isLoading, isError } = useDgsData(params)

  const record = records?.[0]

  // TODO: better handling of these non-success states
  // will check with SY for design
  if (isLoading || isError || !record) {
    return <div>Loading...</div>
  }

  return <DgsTransformedContactInformation {...rest} record={record} />
}

interface DgsTransformedContactInformationProps
  extends Omit<DgsContactInformationProps, "dataSource"> {
  record: DgsApiDatasetSearchResponseSuccess["result"]["records"][number]
}
export const DgsTransformedContactInformation = ({
  record,
  ...rest
}: DgsTransformedContactInformationProps) => {
  const entityName = transformDgsField(rest.entityName, record)

  const description = transformDgsField(rest.description, record)

  const otherInformation = transformDgsField(rest.otherInformation, record)

  const telephone = safeJsonParse<NativeContactInformationProps["telephone"]>(
    transformDgsField(rest.telephone, record),
  )

  const fax = safeJsonParse<NativeContactInformationProps["fax"]>(
    transformDgsField(rest.fax, record),
  )

  const email = safeJsonParse<NativeContactInformationProps["email"]>(
    transformDgsField(rest.email, record),
  )

  const website = safeJsonParse<NativeContactInformationProps["website"]>(
    transformDgsField(rest.website, record),
  )

  const emergencyContact = safeJsonParse<
    NativeContactInformationProps["emergencyContact"]
  >(transformDgsField(rest.emergencyContact, record))

  const operatingHours = safeJsonParse<
    NativeContactInformationProps["operatingHours"]
  >(transformDgsField(rest.operatingHours, record))

  const entityDetails = safeJsonParse<
    NativeContactInformationProps["entityDetails"]
  >(transformDgsField(rest.entityDetails, record))

  const otherMethods = safeJsonParse<
    NativeContactInformationProps["otherMethods"]
  >(transformDgsField(rest.otherMethods, record))

  return (
    <ContactInformationUI
      entityName={entityName}
      description={description}
      telephone={telephone}
      fax={fax}
      email={email}
      website={website}
      emergencyContact={emergencyContact}
      operatingHours={operatingHours}
      entityDetails={entityDetails}
      otherMethods={otherMethods}
      otherInformation={otherInformation}
      {...omit(
        rest,
        "entityName",
        "description",
        "telephone",
        "fax",
        "email",
        "website",
        "emergencyContact",
        "operatingHours",
        "entityDetails",
        "otherMethods",
        "otherInformation",
      )}
    />
  )
}
