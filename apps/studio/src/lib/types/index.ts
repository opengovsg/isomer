import type { NextPage } from "next"
import type { ReactNode } from "react"

export type GetLayout = (page: ReactNode) => ReactNode

export type NextPageWithLayout<
  TProps = object,
  TInitialProps = TProps,
> = NextPage<TProps, TInitialProps> & {
  getLayout?: GetLayout
}
