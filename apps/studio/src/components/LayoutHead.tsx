import Head from "next/head"

import { useEnv } from "~/hooks/useEnv"

export const LayoutHead = () => {
  const { env } = useEnv()

  return (
    <Head>
      <title>{env.NEXT_PUBLIC_APP_NAME}</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}
