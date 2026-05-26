import { useWindowDimensions } from "react-native";

export const BP_TABLET  = 768;
export const BP_DESKTOP = 1024;
export const BP_WIDE    = 1280;

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    width,
    isMobile:  width < BP_TABLET,
    isTablet:  width >= BP_TABLET,
    isDesktop: width >= BP_DESKTOP,
    isWide:    width >= BP_WIDE,
  };
}
