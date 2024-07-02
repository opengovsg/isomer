import type { StackProps, TabsProps } from "@chakra-ui/react";
import {
  createStylesContext,
  forwardRef,
  Stack,
  useMultiStyleConfig,
} from "@chakra-ui/react";

interface NavigationTabListProps extends StackProps {
  variant?: TabsProps["variant"];
}

export const [NavigationalTabListStylesProvider, useNavigationalTabListStyles] =
  createStylesContext("NavigationalTabList");

/** Component to be styled as a tab list, but used for routing instead of conditionally showing tab panels.  */
export const NavigationTabList = forwardRef<NavigationTabListProps, "div">(
  ({ onMouseDown, children, variant, ...props }, ref): JSX.Element => {
    const styles = useMultiStyleConfig("Tabs", { ...props, variant });

    return (
      <NavigationalTabListStylesProvider value={styles}>
        <Stack
          gap="2rem"
          direction="row"
          ref={ref}
          onMouseDown={onMouseDown}
          __css={styles.tablist}
          {...props}
        >
          {children}
        </Stack>
      </NavigationalTabListStylesProvider>
    );
  },
);
