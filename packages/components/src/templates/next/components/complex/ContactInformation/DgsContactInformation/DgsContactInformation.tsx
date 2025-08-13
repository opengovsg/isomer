import { useMemo } from "react"
import omit from "lodash/omit"
import pick from "lodash/pick"

import type {
  DgsApiDatasetSearchParams,
  DgsApiDatasetSearchResponseSuccess,
} from "~/hooks/useDgsData/types"
import type {
  ContactInformationUIProps,
  DgsContactInformationProps,
} from "~/interfaces/complex/ContactInformation"
import { transformDgsField, useDgsData } from "~/hooks/useDgsData"
import { InjectableContactInformationKeys } from "~/interfaces/complex/ContactInformation"
import { safeJsonParse } from "~/utils"
import { ContactInformationUI } from "../components"

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

  // TODO: better handling of these non-success states
  // will check with SY for design
  if (isLoading) {
    return <div>Loading...</div>
  }

  const record = records?.[0]

  // Should display nothing if there is an realtime error
  // as any rendering will likely seems jank and useless
  if (isError || !record) {
    return null
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
  const title = transformDgsField(
    rest.title,
    record,
  ) as ContactInformationUIProps["title"]

  const description = transformDgsField(
    rest.description,
    record,
  ) as ContactInformationUIProps["description"]

  const methods = safeJsonParse<ContactInformationUIProps["methods"]>(
    transformDgsField(rest.methods, record),
  )

  const otherInformation = safeJsonParse<
    ContactInformationUIProps["otherInformation"]
  >(transformDgsField(rest.otherInformation, record))

  return (
    <ContactInformationUI
      title={title}
      description={description}
      methods={methods ?? []}
      otherInformation={otherInformation}
      {...pick(rest, "type", "layout", "LinkComponent")}
      {...omit(rest, InjectableContactInformationKeys)}
    />
  )
}
