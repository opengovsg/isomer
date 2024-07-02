import { useRouter } from "next/router";
import { Stack, StackDivider } from "@chakra-ui/react";

import Suspense from "~/components/Suspense";
import { type NextPageWithLayout } from "~/lib/types";

export function ProfilePostList(): JSX.Element {
  const { query } = useRouter();

  return <Stack spacing={0} divider={<StackDivider />} py="1rem" />;
}

const Profile: NextPageWithLayout = () => {
  return (
    <Suspense fallback={null}>
      <ProfilePostList />
    </Suspense>
  );
};

export default Profile;
