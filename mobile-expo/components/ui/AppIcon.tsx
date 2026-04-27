import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform } from "react-native";
import { SymbolView } from "expo-symbols";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  Bookmark,
  Building2,
  Calendar,
  Camera,
  ClipboardList,
  Check,
  CheckCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Database,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Heart,
  HeartPulse,
  History,
  Home,
  ImagePlus,
  Info,
  Key,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Moon,
  Navigation,
  PawPrint,
  Pencil,
  Phone,
  Pill,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Star,
  Stethoscope,
  Sun,
  Syringe,
  Thermometer,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Weight,
  X,
  XCircle,
} from "lucide-react-native";

type AppIconName =
  | "activity"
  | "add"
  | "alert"
  | "appointments"
  | "award"
  | "back"
  | "bell"
  | "bookmark"
  | "building"
  | "calendar"
  | "camera"
  | "chat"
  | "check"
  | "checkCircle"
  | "checkDouble"
  | "clipboard"
  | "clock"
  | "close"
  | "closeCircle"
  | "community"
  | "dashboard"
  | "database"
  | "discover"
  | "download"
  | "edit"
  | "eye"
  | "eyeOff"
  | "file"
  | "forward"
  | "globe"
  | "health"
  | "heart"
  | "history"
  | "home"
  | "imagePlus"
  | "info"
  | "key"
  | "lock"
  | "location"
  | "logout"
  | "mail"
  | "megaphone"
  | "moon"
  | "navigation"
  | "notifications"
  | "patients"
  | "paw"
  | "pencil"
  | "pets"
  | "phone"
  | "pill"
  | "profile"
  | "reminders"
  | "save"
  | "search"
  | "send"
  | "settings"
  | "share"
  | "shield"
  | "shieldAlert"
  | "shieldCheck"
  | "sliders"
  | "smartphone"
  | "star"
  | "sun"
  | "syringe"
  | "thermometer"
  | "trash"
  | "trendingUp"
  | "user"
  | "userCheck"
  | "users"
  | "vet"
  | "weight";

type AppIconScale = "default" | "unspecified" | "small" | "medium" | "large";
type AppIconVariant = "monochrome" | "hierarchical" | "palette" | "multicolor";
type AppIconWeight =
  | "unspecified"
  | "ultraLight"
  | "thin"
  | "light"
  | "regular"
  | "medium"
  | "semibold"
  | "bold"
  | "heavy"
  | "black";

type FallbackIcon = React.ComponentType<{
  color?: string;
  fill?: string;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}>;

type AppIconConfig = {
  fallback: FallbackIcon;
  ios: string;
  iosFilled?: string;
  scale?: AppIconScale;
  weight?: AppIconWeight;
};

const ICONS: Record<AppIconName, AppIconConfig> = {
  activity: { ios: "waveform.path.ecg", fallback: Activity, scale: "medium", weight: "medium" },
  add: { ios: "plus", iosFilled: "plus.circle.fill", fallback: Plus, scale: "small", weight: "bold" },
  alert: { ios: "exclamationmark.circle", iosFilled: "exclamationmark.circle.fill", fallback: AlertCircle, scale: "medium", weight: "medium" },
  appointments: { ios: "calendar", fallback: Calendar, scale: "medium", weight: "medium" },
  award: { ios: "rosette", fallback: Award, scale: "medium", weight: "medium" },
  back: { ios: "chevron.left", fallback: ChevronLeft, scale: "medium", weight: "semibold" },
  bell: { ios: "bell", iosFilled: "bell.fill", fallback: Bell, scale: "medium", weight: "medium" },
  bookmark: { ios: "bookmark", iosFilled: "bookmark.fill", fallback: Bookmark, scale: "medium", weight: "medium" },
  building: { ios: "building.2", iosFilled: "building.2.fill", fallback: Building2, scale: "medium", weight: "medium" },
  calendar: { ios: "calendar", fallback: Calendar, scale: "medium", weight: "medium" },
  camera: { ios: "camera", iosFilled: "camera.fill", fallback: Camera, scale: "medium", weight: "medium" },
  chat: { ios: "bubble.left.and.bubble.right", iosFilled: "bubble.left.and.bubble.right.fill", fallback: MessageCircle, scale: "medium", weight: "medium" },
  check: { ios: "checkmark", fallback: Check, scale: "medium", weight: "bold" },
  checkCircle: { ios: "checkmark.circle", iosFilled: "checkmark.circle.fill", fallback: CheckCircle, scale: "medium", weight: "medium" },
  checkDouble: { ios: "checkmark.circle", iosFilled: "checkmark.circle.fill", fallback: CheckCheck, scale: "medium", weight: "medium" },
  clipboard: { ios: "list.bullet.clipboard", fallback: ClipboardList, scale: "medium", weight: "medium" },
  clock: { ios: "clock", iosFilled: "clock.fill", fallback: Clock3, scale: "medium", weight: "medium" },
  close: { ios: "xmark", fallback: X, scale: "medium", weight: "bold" },
  closeCircle: { ios: "xmark.circle", iosFilled: "xmark.circle.fill", fallback: XCircle, scale: "medium", weight: "medium" },
  community: { ios: "person.3.fill", fallback: Users, scale: "medium", weight: "medium" },
  dashboard: { ios: "square.grid.2x2.fill", fallback: LayoutDashboard, scale: "medium", weight: "medium" },
  database: { ios: "externaldrive", iosFilled: "externaldrive.fill", fallback: Database, scale: "medium", weight: "medium" },
  discover: { ios: "safari.fill", fallback: Compass, scale: "medium", weight: "medium" },
  download: { ios: "arrow.down.circle", iosFilled: "arrow.down.circle.fill", fallback: Download, scale: "medium", weight: "medium" },
  edit: { ios: "square.and.pencil", fallback: Edit3, scale: "medium", weight: "medium" },
  eye: { ios: "eye", fallback: Eye, scale: "medium", weight: "medium" },
  eyeOff: { ios: "eye.slash", fallback: EyeOff, scale: "medium", weight: "medium" },
  file: { ios: "doc.text", iosFilled: "doc.text.fill", fallback: FileText, scale: "medium", weight: "medium" },
  forward: { ios: "chevron.right", fallback: ChevronRight, scale: "medium", weight: "semibold" },
  globe: { ios: "globe", fallback: Globe, scale: "medium", weight: "regular" },
  health: { ios: "heart.text.square.fill", fallback: HeartPulse, scale: "medium", weight: "medium" },
  heart: { ios: "heart", iosFilled: "heart.fill", fallback: Heart, scale: "medium", weight: "medium" },
  history: { ios: "clock.arrow.circlepath", fallback: History, scale: "medium", weight: "medium" },
  home: { ios: "house.fill", fallback: Home, scale: "medium", weight: "medium" },
  imagePlus: { ios: "photo.badge.plus", fallback: ImagePlus, scale: "medium", weight: "medium" },
  info: { ios: "info.circle", iosFilled: "info.circle.fill", fallback: Info, scale: "medium", weight: "medium" },
  key: { ios: "key", iosFilled: "key.fill", fallback: Key, scale: "medium", weight: "medium" },
  lock: { ios: "lock", iosFilled: "lock.fill", fallback: Lock, scale: "medium", weight: "medium" },
  location: { ios: "mappin", iosFilled: "mappin.circle.fill", fallback: MapPin, scale: "medium", weight: "medium" },
  logout: { ios: "rectangle.portrait.and.arrow.right", fallback: LogOut, scale: "medium", weight: "medium" },
  mail: { ios: "envelope", iosFilled: "envelope.fill", fallback: Mail, scale: "medium", weight: "medium" },
  megaphone: { ios: "megaphone", iosFilled: "megaphone.fill", fallback: Megaphone, scale: "medium", weight: "medium" },
  moon: { ios: "moon", iosFilled: "moon.fill", fallback: Moon, scale: "medium", weight: "medium" },
  navigation: { ios: "location.north.circle", iosFilled: "location.north.circle.fill", fallback: Navigation, scale: "medium", weight: "medium" },
  notifications: { ios: "bell.fill", fallback: Bell, scale: "medium", weight: "medium" },
  patients: { ios: "pawprint.fill", fallback: PawPrint, scale: "medium", weight: "medium" },
  paw: { ios: "pawprint", iosFilled: "pawprint.fill", fallback: PawPrint, scale: "medium", weight: "medium" },
  pencil: { ios: "pencil", fallback: Pencil, scale: "medium", weight: "medium" },
  pets: { ios: "pawprint.fill", fallback: PawPrint, scale: "medium", weight: "medium" },
  phone: { ios: "phone", iosFilled: "phone.fill", fallback: Phone, scale: "medium", weight: "medium" },
  pill: { ios: "pills", fallback: Pill, scale: "medium", weight: "medium" },
  profile: { ios: "person.crop.circle.fill", fallback: User, scale: "medium", weight: "regular" },
  reminders: { ios: "bell.fill", fallback: Bell, scale: "medium", weight: "medium" },
  save: { ios: "square.and.arrow.down", iosFilled: "square.and.arrow.down.fill", fallback: Save, scale: "medium", weight: "medium" },
  search: { ios: "magnifyingglass", fallback: Search, scale: "medium", weight: "regular" },
  send: { ios: "paperplane", iosFilled: "paperplane.fill", fallback: Send, scale: "medium", weight: "medium" },
  settings: { ios: "gearshape.fill", fallback: Settings, scale: "medium", weight: "medium" },
  share: { ios: "square.and.arrow.up", fallback: Share2, scale: "medium", weight: "medium" },
  shield: { ios: "shield", iosFilled: "shield.fill", fallback: Shield, scale: "medium", weight: "medium" },
  shieldAlert: { ios: "exclamationmark.shield", iosFilled: "exclamationmark.shield.fill", fallback: ShieldAlert, scale: "medium", weight: "medium" },
  shieldCheck: { ios: "checkmark.shield", iosFilled: "checkmark.shield.fill", fallback: ShieldCheck, scale: "medium", weight: "medium" },
  sliders: { ios: "slider.horizontal.3", fallback: SlidersHorizontal, scale: "medium", weight: "medium" },
  smartphone: { ios: "smartphone", fallback: Smartphone, scale: "medium", weight: "medium" },
  star: { ios: "star", iosFilled: "star.fill", fallback: Star, scale: "medium", weight: "medium" },
  sun: { ios: "sun.max", iosFilled: "sun.max.fill", fallback: Sun, scale: "medium", weight: "medium" },
  syringe: { ios: "syringe", fallback: Syringe, scale: "medium", weight: "medium" },
  thermometer: { ios: "thermometer.medium", fallback: Thermometer, scale: "medium", weight: "medium" },
  trash: { ios: "trash", iosFilled: "trash.fill", fallback: Trash2, scale: "medium", weight: "medium" },
  trendingUp: { ios: "chart.line.uptrend.xyaxis", fallback: TrendingUp, scale: "medium", weight: "medium" },
  user: { ios: "person", iosFilled: "person.fill", fallback: User, scale: "medium", weight: "regular" },
  userCheck: { ios: "person.badge.shield.checkmark", fallback: UserCheck, scale: "medium", weight: "medium" },
  users: { ios: "person.2", iosFilled: "person.2.fill", fallback: Users, scale: "medium", weight: "medium" },
  vet: { ios: "stethoscope", fallback: Stethoscope, scale: "medium", weight: "medium" },
  weight: { ios: "scalemass", fallback: Weight, scale: "medium", weight: "medium" },
};

type AppIconProps = {
  color?: string;
  fill?: string;
  filled?: boolean;
  name: AppIconName;
  scale?: AppIconScale;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  variant?: AppIconVariant;
  weight?: AppIconWeight;
};

function isFilledValue(fill?: string) {
  if (!fill) return false;
  const normalized = fill.toLowerCase();
  return normalized !== "transparent" && normalized !== "none";
}

export default function AppIcon({
  color = "#111827",
  fill,
  filled,
  name,
  scale,
  size = 24,
  strokeWidth = 2,
  style,
  variant = "monochrome",
  weight,
}: AppIconProps) {
  const config = ICONS[name];
  const FallbackIcon = config.fallback;
  const shouldFill = filled ?? isFilledValue(fill);
  const symbolName = shouldFill ? config.iosFilled ?? config.ios : config.ios;

  if (Platform.OS === "ios") {
    return (
      <SymbolView
        fallback={
          <FallbackIcon
            color={color}
            fill={fill ?? (shouldFill ? color : "transparent")}
            size={size}
            strokeWidth={strokeWidth}
            style={style}
          />
        }
        name={symbolName as any}
        scale={scale ?? config.scale ?? "medium"}
        size={size}
        style={style}
        tintColor={shouldFill && fill ? fill : color}
        type={variant}
        weight={weight ?? config.weight ?? "medium"}
      />
    );
  }

  return (
    <FallbackIcon
      color={color}
      fill={fill ?? (shouldFill ? color : "transparent")}
      size={size}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}

export type { AppIconName, AppIconProps, AppIconScale, AppIconVariant, AppIconWeight };
