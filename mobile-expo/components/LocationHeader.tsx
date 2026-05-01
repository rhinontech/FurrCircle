import React, { useState } from "react";
import {
  View,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import AppIcon from "./ui/AppIcon";
import { useTheme } from "../contexts/ThemeContext";
import { useLocation } from "../contexts/LocationContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LocationHeader() {
  const { colors } = useTheme();
  const {
    location,
    fetchCurrentLocation,
    isLoading,
    setManualLocation,
    recentLocations,
  } = useLocation();
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const displayCity = location.city || "Select City";
  const displayRegion =
    location.region || location.address || "Tap to set location";

  const handleUseCurrentLocation = async () => {
    await fetchCurrentLocation();
    setModalVisible(false);
  };

  return (
    <>
      {/* ── Blinkit-style trigger ── */}
      <Pressable onPress={() => setModalVisible(true)} style={styles.trigger}>
        {/* Line 1 — "FurrCircle in" label */}
        <Text style={[styles.triggerBrand, { color: colors.brand }]}>
          FurrCircle in
        </Text>

        {/* Line 2 — pin + city + chevron */}
        <View style={styles.triggerCityRow}>
          <AppIcon
            name="location"
            size={14}
            color={colors.textPrimary}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[styles.triggerCity, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {displayCity}
          </Text>
          {/* <AppIcon
            name="forward"
            size={13}
            color={colors.textSecondary}
            style={{ marginLeft: 3, transform: [{ rotate: "90deg" }] }}
          /> */}
        </View>

        {/* Line 3 — state, indented under city */}
        <Text
          style={[styles.triggerRegion, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {displayRegion}
        </Text>
      </Pressable>

      {/* ── Bottom sheet modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* dim backdrop — tap to dismiss */}
          <Pressable
            style={styles.backdrop}
            onPress={() => setModalVisible(false)}
          />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.bgCard,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.handle} />

            {/* Title row */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                Choose Location
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.bgSubtle }]}
              >
                <AppIcon name="close" size={16} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* GPS button — render-props so flexDirection lives on a View, not Pressable */}
            <Pressable onPress={handleUseCurrentLocation}>
              {({ pressed }) => (
                <View
                  style={[
                    styles.gpsBtn,
                    {
                      backgroundColor: colors.bgSubtle,
                      borderColor: colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.gpsIconBox,
                      { backgroundColor: colors.brand + "20" },
                    ]}
                  >
                    <AppIcon name="navigation" size={18} color={colors.brand} />
                  </View>
                  <View style={styles.gpsLabelWrap}>
                    <Text style={[styles.gpsTitle, { color: colors.brand }]}>
                      Use current location
                    </Text>
                    {isLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.brand}
                        style={{ marginTop: 2, alignSelf: "flex-start" }}
                      />
                    ) : (
                      <Text
                        style={[styles.gpsSub, { color: colors.textSecondary }]}
                      >
                        Detect via GPS
                      </Text>
                    )}
                  </View>
                  <AppIcon name="forward" size={15} color={colors.brand} />
                </View>
              )}
            </Pressable>

            {/* OR divider */}
            <View style={styles.divider}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                OR SEARCH
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>

            {/* Search input */}
            <View
              style={[
                styles.searchWrap,
                {
                  backgroundColor: colors.bgSubtle,
                  borderColor: colors.border,
                },
              ]}
            >
              <AppIcon
                name="search"
                size={16}
                color={colors.textMuted}
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Search area, street, or building..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                returnKeyType="search"
                onSubmitEditing={async (e) => {
                  const query = e.nativeEvent.text.trim();
                  if (!query) return;
                  try {
                    const results = await Location.geocodeAsync(query);
                    if (results.length > 0) {
                      const { latitude, longitude } = results[0];
                      const reverse = await Location.reverseGeocodeAsync({
                        latitude,
                        longitude,
                      });
                      let addr = query;
                      let city: string | null = null;
                      let region: string | null = null;
                      if (reverse.length > 0) {
                        const p = reverse[0];
                        addr =
                          [p.streetNumber, p.street, p.city]
                            .filter(Boolean)
                            .join(", ") || query;
                        city = p.city ?? null;
                        region = p.region ?? null;
                      }
                      setManualLocation(
                        latitude,
                        longitude,
                        addr,
                        city || undefined,
                        region || undefined,
                      );
                      setModalVisible(false);
                    } else {
                      Alert.alert(
                        "Not Found",
                        "Could not find that location. Try being more specific.",
                      );
                    }
                  } catch {
                    Alert.alert("Error", "Failed to search for location.");
                  }
                }}
              />
            </View>
            <Text style={[styles.searchHint, { color: colors.textMuted }]}>
              Type and press Search / Enter
            </Text>

            {/* Recent searches */}
            {recentLocations.length > 0 && (
              <ScrollView
                style={styles.recentScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.recentLabel, { color: colors.textMuted }]}>
                  RECENT
                </Text>
                {recentLocations.map((loc, idx) => {
                  const primary =
                    loc.address?.split(",")[0]?.trim() ||
                    loc.city ||
                    "Saved location";
                  const secondary =
                    loc.address && loc.address !== primary
                      ? loc.address
                      : loc.city || "";
                  return (
                    <Pressable
                      key={`${loc.latitude}-${idx}`}
                      onPress={() => {
                        setManualLocation(
                          loc.latitude!,
                          loc.longitude!,
                          loc.address!,
                          loc.city || undefined,
                        );
                        setModalVisible(false);
                      }}
                    >
                      {({ pressed }) => (
                        <View
                          style={[
                            styles.recentRow,
                            {
                              opacity: pressed ? 0.6 : 1,
                              borderBottomWidth:
                                idx === recentLocations.length - 1
                                  ? 0
                                  : StyleSheet.hairlineWidth,
                              borderBottomColor: colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.recentIconBox,
                              { backgroundColor: colors.bgSubtle },
                            ]}
                          >
                            <AppIcon
                              name="history"
                              size={14}
                              color={colors.textMuted}
                            />
                          </View>
                          <View style={styles.recentTextWrap}>
                            <Text
                              style={[
                                styles.recentPrimary,
                                { color: colors.textPrimary },
                              ]}
                              numberOfLines={1}
                            >
                              {primary}
                            </Text>
                            {secondary !== "" && (
                              <Text
                                style={[
                                  styles.recentSecondary,
                                  { color: colors.textMuted },
                                ]}
                                numberOfLines={1}
                              >
                                {secondary}
                              </Text>
                            )}
                          </View>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Trigger ──
  trigger: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  triggerBrand: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  triggerCityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  triggerCity: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  triggerRegion: {
    fontSize: 11,
    marginTop: 2,
    paddingLeft: 18,
  },

  // ── Modal shell ──
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.14)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── GPS button ──
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 14,
  },
  gpsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  gpsLabelWrap: {
    flex: 1,
    marginRight: 8,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  gpsSub: {
    fontSize: 12,
    marginTop: 2,
  },

  // ── OR divider ──
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginHorizontal: 10,
  },

  // ── Search ──
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
  },
  searchHint: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 14,
  },

  // ── Recent ──
  recentScroll: {
    maxHeight: 220,
  },
  recentLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  recentIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  recentTextWrap: {
    flex: 1,
  },
  recentPrimary: {
    fontSize: 13,
    fontWeight: "600",
  },
  recentSecondary: {
    fontSize: 11,
    marginTop: 1,
  },
});
