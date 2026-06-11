import { Platform } from "react-native";

export const TAB_BAR_HEIGHT = 64;

/**
 * Bottom offset of the floating pill nav, Instagram-style: hugs the screen
 * bottom, dipping slightly into the iOS home-indicator inset. On Android it
 * stays fully above the system nav area.
 */
export function tabBarBottom(insetBottom: number) {
  if (Platform.OS === "ios") return Math.max(insetBottom - 12, 12);
  return insetBottom > 0 ? insetBottom + 4 : 12;
}

/** Distance from screen bottom that FABs / bottom content need to clear the pill. */
export function tabBarClearance(insetBottom: number, gap = 12) {
  return tabBarBottom(insetBottom) + TAB_BAR_HEIGHT + gap;
}
