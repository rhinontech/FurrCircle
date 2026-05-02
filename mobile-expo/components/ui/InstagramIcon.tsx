import React from "react";
import Svg, { Rect, Path, Circle, Line } from "react-native-svg";

export const Instagram = ({ color = "currentColor", size = 24, strokeWidth = 2, ...props }: any) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <Line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </Svg>
);
