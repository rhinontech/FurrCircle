import { useWindowDimensions } from "react-native";

export const TABLET_BREAKPOINT = 720;
export const SIDEBAR_WIDTH = 256;
export const MAX_CONTENT_WIDTH = 720;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  return {
    isTablet,
    isLandscape: width > height,
    screenWidth: width,
    screenHeight: height,
    sidebarWidth: isTablet ? SIDEBAR_WIDTH : 0,
    contentMaxWidth: MAX_CONTENT_WIDTH,
    numColumns: isTablet ? 2 : 1,
    hp: isTablet ? 32 : 20,
  };
}
