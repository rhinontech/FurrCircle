import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Home, Users, Bone, Compass, LayoutGrid, PawPrint, Plus, Bell } from "./ui/icons";
import { colors } from "../lib/theme";
import { useTokens } from "../lib/theme-store";
import { useBreakpoint } from "../lib/breakpoints";
import { Avatar } from "./Avatar";
import { useNotificationStore } from "../lib/notification-store";
import { useAuthStore } from "../lib/auth-store";

const NAV_ITEMS = [
  { key: "feed",          icon: Home,       label: "Feed",          path: "/(tabs)/" },
  { key: "community",    icon: Users,      label: "Circles",       path: "/(tabs)/community" },
  { key: "match",        icon: Bone,       label: "Match",         path: "/(tabs)/match" },
  { key: "discover",     icon: Compass,    label: "Discover",      path: "/(tabs)/discover" },
  { key: "profile",      icon: LayoutGrid, label: "Profile",       path: "/(tabs)/profile" },
  { key: "notifications",icon: Bell,       label: "Notifications", path: "/notifications" },
];

export function SideNav() {
  const router   = useRouter();
  const pathname = usePathname();
  const tk       = useTokens();
  const { isDesktop } = useBreakpoint();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const user = useAuthStore((s) => s.user);
  const wide = isDesktop;               // show labels + user card
  const navW = wide ? 240 : 84;

  function isActive(path: string) {
    if (path === "/(tabs)/") return pathname === "/" || pathname === "/(tabs)/";
    return pathname.startsWith(path.replace("/(tabs)", ""));
  }

  return (
    <View style={[styles.aside, { width: navW, backgroundColor: tk.card, borderRightColor: tk.border }]}>
      {/* Logo */}
      <TouchableOpacity onPress={() => router.push("/")} style={styles.logo} activeOpacity={0.8}>
        <View style={styles.logoIcon}>
          <PawPrint size={20} color="#fff" strokeWidth={2} />
        </View>
        {wide && <Text style={[styles.logoText, { color: tk.text }]}>Furr Circle</Text>}
      </TouchableOpacity>

      {/* Nav items */}
      <View style={styles.navList}>
        {NAV_ITEMS.map(({ key, icon: Icon, label, path }) => {
          const active = isActive(path);
          const isNotifItem = key === "notifications";
          const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => router.push(path as any)}
              style={[
                styles.navItem,
                active && styles.navItemActive,
                !wide && styles.navItemNarrow,
              ]}
              activeOpacity={0.75}
            >
              <View style={{ position: "relative" }}>
                <Icon
                  size={24}
                  color={active ? colors.primary : tk.textMuted}
                  strokeWidth={active ? 2.4 : 2}
                />
                {isNotifItem && unreadCount > 0 && (
                  <View style={styles.sideNavBadge}>
                    <Text style={styles.sideNavBadgeText}>{badgeLabel}</Text>
                  </View>
                )}
              </View>
              {wide && (
                <Text style={[styles.navLabel, { color: active ? colors.primary : tk.textMuted }]}>
                  {label}
                </Text>
              )}
              {/* Badge in wide mode: show count next to label */}
              {wide && isNotifItem && unreadCount > 0 && (
                <View style={[styles.sideNavBadgeWide, { marginLeft: "auto" }]}>
                  <Text style={styles.sideNavBadgeText}>{badgeLabel}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* New Post button */}
      <TouchableOpacity
        onPress={() => router.push("/compose")}
        style={[styles.newPostBtn, !wide && styles.newPostBtnNarrow]}
        activeOpacity={0.85}
      >
        <Plus size={20} color="#fff" strokeWidth={2.5} />
        {wide && <Text style={styles.newPostText}>New post</Text>}
      </TouchableOpacity>

      {/* User card — only on wide */}
      {wide && user && (
        <TouchableOpacity
          onPress={() => router.push(`/u/${user.username}`)}
          style={[styles.userCard, { backgroundColor: tk.bg }]}
          activeOpacity={0.8}
        >
          <Avatar
            source={user.avatar_url?.startsWith('http') ? { uri: user.avatar_url } : require("../../src/assets/doodle-boy-dog.png")}
            name={user.name || user.username || ""}
            size={36}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.userName, { color: tk.text }]} numberOfLines={1}>{user.name || user.username}</Text>
            <Text style={[styles.userHandle, { color: tk.textMuted }]}>@{user.username}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  aside: {
    height: "100%",
    borderRightWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 24,
    justifyContent: "flex-start",
    gap: 4,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 12,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
  },
  navList: { gap: 4 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navItemNarrow: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: "rgba(37,99,235,0.1)",
  },
  navLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
  newPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.foreground,
    borderRadius: 24,
    paddingVertical: 12,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  newPostBtnNarrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    paddingVertical: 0,
    alignSelf: "center",
  },
  newPostText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 12,
    marginTop: "auto",
  },
  userName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  userHandle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  sideNavBadge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  sideNavBadgeWide: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  sideNavBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
    lineHeight: 12,
  },
});
