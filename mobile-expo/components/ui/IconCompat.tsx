import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import AppIcon, {
  type AppIconName,
  type AppIconScale,
  type AppIconVariant,
  type AppIconWeight,
} from "./AppIcon";

type CompatIconProps = {
  color?: string;
  fill?: string;
  filled?: boolean;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  scale?: AppIconScale;
  variant?: AppIconVariant;
  weight?: AppIconWeight;
};

function makeCompatIcon(name: AppIconName, defaultProps: Partial<CompatIconProps> = {}) {
  const CompatIcon = ({ fill, filled, ...props }: CompatIconProps) => (
    <AppIcon
      fill={fill}
      filled={filled ?? (fill !== undefined && fill !== "transparent" && fill !== "none")}
      name={name}
      {...defaultProps}
      {...props}
    />
  );

  CompatIcon.displayName = `Compat(${name})`;
  return CompatIcon;
}

export const Activity = makeCompatIcon("activity");
export const AlertCircle = makeCompatIcon("alert");
export const ArrowLeft = makeCompatIcon("back");
export const ArrowRight = makeCompatIcon("forward");
export const Award = makeCompatIcon("award");
export const Bell = makeCompatIcon("bell");
export const Bookmark = makeCompatIcon("bookmark");
export const Building2 = makeCompatIcon("building");
export const Calendar = makeCompatIcon("calendar");
export const CalendarDays = makeCompatIcon("calendar");
export const Camera = makeCompatIcon("camera");
export const Check = makeCompatIcon("check");
export const CheckCheck = makeCompatIcon("checkDouble");
export const CheckCircle = makeCompatIcon("checkCircle");
export const ChevronLeft = makeCompatIcon("back");
export const ChevronRight = makeCompatIcon("forward");
export const ClipboardList = makeCompatIcon("clipboard");
export const Clock = makeCompatIcon("clock");
export const Clock3 = makeCompatIcon("clock");
export const Compass = makeCompatIcon("discover");
export const Database = makeCompatIcon("database");
export const Download = makeCompatIcon("download");
export const Edit3 = makeCompatIcon("edit");
export const Eye = makeCompatIcon("eye");
export const EyeOff = makeCompatIcon("eyeOff");
export const FileText = makeCompatIcon("file");
export const Globe = makeCompatIcon("globe");
export const Heart = makeCompatIcon("heart");
export const HeartPulse = makeCompatIcon("health");
export const History = makeCompatIcon("history");
export const Home = makeCompatIcon("home");
export const ImagePlus = makeCompatIcon("imagePlus");
export const Info = makeCompatIcon("info");
export const Key = makeCompatIcon("key");
export const KeyRound = makeCompatIcon("key");
export const LayoutDashboard = makeCompatIcon("dashboard");
export const Lock = makeCompatIcon("lock");
export const LogOut = makeCompatIcon("logout");
export const Mail = makeCompatIcon("mail");
export const Megaphone = makeCompatIcon("megaphone");
export const MapPin = makeCompatIcon("location");
export const MessageCircle = makeCompatIcon("chat");
export const MessageSquarePlus = makeCompatIcon("chat", { filled: true });
export const Moon = makeCompatIcon("moon");
export const Navigation = makeCompatIcon("navigation");
export const PawPrint = makeCompatIcon("paw");
export const Pencil = makeCompatIcon("pencil");
export const Phone = makeCompatIcon("phone");
export const Pill = makeCompatIcon("pill");
export const Plus = makeCompatIcon("add");
export const Save = makeCompatIcon("save");
export const Search = makeCompatIcon("search");
export const Send = makeCompatIcon("send");
export const Settings = makeCompatIcon("settings");
export const Share2 = makeCompatIcon("share");
export const Shield = makeCompatIcon("shield");
export const ShieldAlert = makeCompatIcon("shieldAlert");
export const ShieldCheck = makeCompatIcon("shieldCheck");
export const Sliders = makeCompatIcon("sliders");
export const Smartphone = makeCompatIcon("smartphone");
export const Star = makeCompatIcon("star");
export const Stethoscope = makeCompatIcon("vet");
export const Sun = makeCompatIcon("sun");
export const Syringe = makeCompatIcon("syringe");
export const Thermometer = makeCompatIcon("thermometer");
export const Trash2 = makeCompatIcon("trash");
export const TrendingUp = makeCompatIcon("trendingUp");
export const User = makeCompatIcon("user");
export const UserCheck = makeCompatIcon("userCheck");
export const Users = makeCompatIcon("users");
export const Weight = makeCompatIcon("weight");
export const X = makeCompatIcon("close");
export const XCircle = makeCompatIcon("closeCircle");
