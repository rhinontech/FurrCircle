import React from "react";
import { View, Text, Pressable, Image, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AppIcon, { type AppIconName } from "./AppIcon";
import { SIDEBAR_WIDTH } from "@/hooks/useResponsive";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export type SidebarTab = {
  route: string;
  label: string;
  icon: AppIconName;
  isCenter?: boolean;
};

type Props = {
  tabs: SidebarTab[];
  brandLabel?: string;
};

export default function TabletSidebar({ tabs, brandLabel = "FurrCircle" }: Props) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const isVet = brandLabel !== "FurrCircle";

  function isActive(route: string) {
    if (route === "/" || route === "/index") return pathname === "/" || pathname === "/index";
    return pathname.startsWith(route);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const gradientColors: [string, string] = isDark
    ? ["#1e293b", "#0f172a"]
    : ["#1e3a8a", "#2563eb"];

  const bgColor = isDark ? "#0f172a" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const sectionLabelColor = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)";

  return (
    <View style={[styles.root, { width: SIDEBAR_WIDTH, backgroundColor: bgColor, borderRightColor: borderColor }]}>

      {/* ── Gradient header ── */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 18 }]}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <AppIcon name="paw" size={18} color="#fff" filled />
          </View>
          <View>
            <Text style={styles.brandName}>{brandLabel}</Text>
            {isVet && <Text style={styles.brandBadge}>Vet Portal</Text>}
          </View>
        </View>

        {/* User greeting card */}
        <View style={styles.greetCard}>
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={styles.greetAvatar} />
            : (
              <View style={styles.greetAvatarFallback}>
                <AppIcon name="profile" size={16} color="#fff" filled />
              </View>
            )
          }
          <View style={styles.greetText}>
            <Text style={styles.greetSub}>{greeting} 👋</Text>
            <Text style={styles.greetName} numberOfLines={1}>
              {user?.name?.split(" ")[0] || "Guest"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Nav ── */}
      <View style={styles.navContainer}>
        <Text style={[styles.navSection, { color: sectionLabelColor }]}>MENU</Text>

        {tabs.map((tab) => {
          const active = isActive(tab.route);

          const pillBg = active
            ? colors.brand
            : tab.isCenter
              ? (isDark ? "rgba(59,130,246,0.15)" : "rgba(30,58,138,0.07)")
              : "transparent";

          const iconColor = active
            ? "#fff"
            : tab.isCenter
              ? colors.brand
              : (isDark ? "#94a3b8" : "#64748b");

          const labelColor = active
            ? "#fff"
            : tab.isCenter
              ? colors.brand
              : (isDark ? "#94a3b8" : "#475569");

          return (
            <Pressable
              key={tab.route}
              onPress={() => router.push(tab.route as any)}
            >
              {({ pressed }) => (
                <View style={[
                  styles.navRow,
                  { backgroundColor: pressed ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)") : pillBg },
                ]}>
                  {/* Icon */}
                  <View style={[
                    styles.iconBox,
                    active && styles.iconBoxActive,
                  ]}>
                    <AppIcon
                      name={tab.icon}
                      size={21}
                      color={iconColor}
                      filled={active || tab.isCenter}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </View>

                  {/* Label */}
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.navLabel,
                      { color: labelColor, fontWeight: active ? "700" : tab.isCenter ? "600" : "500" },
                    ]}
                  >
                    {tab.label}
                  </Text>

                  {/* Featured dot */}
                  {tab.isCenter && !active && (
                    <View style={[styles.dot, { backgroundColor: colors.brand }]} />
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Footer user card ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: borderColor }]}>
        <View style={[styles.footerCard, {
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(30,58,138,0.05)",
          borderColor,
        }]}>
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={styles.footerAvatar} />
            : (
              <View style={[styles.footerAvatarFallback, { backgroundColor: isDark ? "#1e3a5f" : "#dbeafe" }]}>
                <AppIcon name="profile" size={15} color={colors.brand} filled />
              </View>
            )
          }
          <View style={{ flex: 1, overflow: "hidden" }}>
            <Text style={[styles.footerName, { color: colors.textPrimary }]} numberOfLines={1}>
              {user?.name || "Guest"}
            </Text>
            <Text style={[styles.footerRole, { color: colors.textMuted }]} numberOfLines={1}>
              {isVet ? "Veterinarian" : "Pet Owner"}
            </Text>
          </View>
          <View style={[styles.footerBadge, { backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#eff6ff" }]}>
            <AppIcon name={isVet ? "vet" : "paw"} size={13} color={colors.brand} filled />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRightWidth: StyleSheet.hairlineWidth,
    flexDirection: "column",
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 14,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  brandBadge: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  greetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  greetAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  greetAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  greetText: {
    flex: 1,
  },
  greetSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "500",
  },
  greetName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  // Nav
  navContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 14,
  },
  navSection: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginLeft: 6,
    marginBottom: 8,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 2,
  },
  iconBox: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: 12,
  },
  iconBoxActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 10,
  },
  navLabel: {
    flex: 1,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
    marginLeft: 4,
  },

  // Footer
  footer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  footerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    flexShrink: 0,
  },
  footerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  footerName: {
    fontSize: 13,
    fontWeight: "600",
  },
  footerRole: {
    fontSize: 11,
    marginTop: 1,
  },
  footerBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
