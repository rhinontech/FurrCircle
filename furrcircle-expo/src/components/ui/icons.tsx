/**
 * Apple-style icon set (Ionicons — mirrors SF Symbols, renders identically on
 * iOS and Android), exposed through a lucide-compatible API so call sites keep
 * their existing props:
 *
 *   <Heart size={24} color={tk.text} fill={liked ? colors.coral : "none"} />
 *
 * - `fill` set to a colour switches to the filled glyph in that colour
 *   (lucide's fill behaviour); "none"/undefined renders the outline glyph.
 * - `strokeWidth` is accepted and ignored (font glyphs have fixed weight).
 */
import { Ionicons } from "@expo/vector-icons";
import type { StyleProp, TextStyle } from "react-native";

type IonName = keyof typeof Ionicons.glyphMap;

export type IconProps = {
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
  style?: StyleProp<TextStyle>;
};

const make = (outline: IonName, filled: IonName = outline) => {
  return function Icon({ size = 24, color = "#000", fill, style }: IconProps) {
    const isFilled = !!fill && fill !== "none";
    return (
      <Ionicons
        name={isFilled ? filled : outline}
        size={size}
        color={isFilled ? fill : color}
        style={style}
      />
    );
  };
};

export const Activity = make("pulse-outline", "pulse");
export const AlertCircle = make("alert-circle-outline", "alert-circle");
export const ArrowLeft = make("arrow-back");
export const ArrowRight = make("arrow-forward");
export const ArrowUp = make("arrow-up");
export const Award = make("ribbon-outline", "ribbon");
export const BadgeCheck = make("checkmark-circle-outline", "checkmark-circle");
export const Bell = make("notifications-outline", "notifications");
export const Bone = make("paw-outline", "paw");
export const Bookmark = make("bookmark-outline", "bookmark");
export const Cake = make("balloon-outline", "balloon");
export const Calendar = make("calendar-outline", "calendar");
export const CalendarDays = make("calendar-outline", "calendar");
export const Camera = make("camera-outline", "camera");
export const Check = make("checkmark");
export const CheckCheck = make("checkmark-done");
export const CheckCircle2 = make("checkmark-circle-outline", "checkmark-circle");
export const Circle = make("ellipse-outline");
export const ChevronDown = make("chevron-down");
export const ChevronLeft = make("chevron-back");
export const ChevronRight = make("chevron-forward");
export const ChevronUp = make("chevron-up");
export const Clock = make("time-outline", "time");
export const Compass = make("compass-outline", "compass");
export const Edit2 = make("pencil-outline", "pencil");
export const Eye = make("eye-outline", "eye");
export const EyeOff = make("eye-off-outline", "eye-off");
export const FileText = make("document-text-outline", "document-text");
export const Flag = make("flag-outline", "flag");
export const Flame = make("flame-outline", "flame");
export const FolderHeart = make("folder-open-outline", "folder-open");
export const Gift = make("gift-outline", "gift");
export const Globe = make("globe-outline", "globe");
export const Grid3x3 = make("grid-outline", "grid");
export const HandHeart = make("heart-circle-outline", "heart-circle");
export const Hash = make("pricetag-outline", "pricetag");
export const Heart = make("heart-outline", "heart");
export const HelpCircle = make("help-circle-outline", "help-circle");
export const Home = make("home-outline", "home");
export const Image = make("image-outline", "image");
export const Inbox = make("mail-open-outline", "mail-open");
export const Info = make("information-circle-outline", "information-circle");
export const LayoutGrid = make("grid-outline", "grid");
export const LocateFixed = make("locate");
export const Lock = make("lock-closed-outline", "lock-closed");
export const LogOut = make("log-out-outline", "log-out");
export const Moon = make("moon-outline", "moon");
export const MapPin = make("location-outline", "location");
export const MessageCircle = make("chatbubble-outline", "chatbubble");
export const MoreVertical = make("ellipsis-vertical");
export const PawPrint = make("paw-outline", "paw");
export const Phone = make("call-outline", "call");
export const Pill = make("medical-outline", "medical");
export const Play = make("play");
export const Plus = make("add");
export const Ruler = make("resize-outline", "resize");
export const Search = make("search-outline", "search");
export const Send = make("paper-plane-outline", "paper-plane");
export const Settings = make("settings-outline", "settings");
export const Share2 = make("share-social-outline", "share-social");
export const ShieldAlert = make("shield-half-outline", "shield-half");
export const ShieldCheck = make("shield-checkmark-outline", "shield-checkmark");
export const ShieldOff = make("ban-outline", "ban");
export const Siren = make("warning-outline", "warning");
export const Sparkles = make("sparkles-outline", "sparkles");
export const Star = make("star-outline", "star");
export const Stethoscope = make("medkit-outline", "medkit");
export const Sun = make("sunny-outline", "sunny");
export const Syringe = make("eyedrop-outline", "eyedrop");
export const ThumbsUp = make("thumbs-up-outline", "thumbs-up");
export const Trash2 = make("trash-outline", "trash");
export const TrendingUp = make("trending-up");
export const User = make("person-outline", "person");
export const UserPlus = make("person-add-outline", "person-add");
export const Users = make("people-outline", "people");
export const Volume2 = make("volume-high");
export const VolumeX = make("volume-mute");
export const X = make("close");
