import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Heart, Home, Clock, CheckCircle, XCircle, PawPrint } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { userAdoptionsApi, type AdoptionApplication } from "@/services/users/adoptionsApi";

const STATUS_META: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fffbeb", Icon: Clock },
  approved: { label: "Approved", color: "#10b981", bg: "#ecfdf5", Icon: CheckCircle },
  rejected: { label: "Rejected", color: "#ef4444", bg: "#fef2f2", Icon: XCircle },
};

export default function MyApplicationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const data = await userAdoptionsApi.listMyApplications();
      setApplications(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications])
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "700",
            color: colors.textPrimary,
            textAlign: "center",
            marginRight: 40,
          }}
        >
          My Applications
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchApplications();
              }}
              tintColor={colors.brand}
            />
          }
        >
          {applications.length === 0 ? (
            <View
              style={{
                padding: 40,
                borderRadius: 20,
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.bgSubtle,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PawPrint size={28} color={colors.textMuted} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
                No applications yet
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  textAlign: "center",
                  lineHeight: 19,
                }}
              >
                Browse pets in Discover and apply to adopt or foster one.
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/discover")}
                style={{
                  backgroundColor: colors.brand,
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
                  Browse Pets
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {applications.map((app) => {
                const meta = STATUS_META[app.status] || STATUS_META.pending;
                const StatusIcon = meta.Icon;
                const bgColor = isDark ? colors.bgCard : meta.bg;

                return (
                  <View
                    key={app.id}
                    style={{
                      backgroundColor: colors.bgCard,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: colors.border,
                      overflow: "hidden",
                    }}
                  >
                    {/* Pet info */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                        gap: 12,
                      }}
                    >
                      {app.pet?.avatar_url ? (
                        <Image
                          source={{ uri: app.pet.avatar_url }}
                          style={{ width: 56, height: 56, borderRadius: 14 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            backgroundColor: colors.bgSubtle,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <PawPrint size={24} color={colors.textMuted} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}
                        >
                          {app.pet?.name || "Unknown Pet"}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                          {[app.pet?.species, app.pet?.breed].filter(Boolean).join(" · ")}
                          {app.pet?.city ? ` · ${app.pet.city}` : ""}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                          Applied {formatDate(app.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Badges */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        paddingHorizontal: 16,
                        paddingBottom: 14,
                        alignItems: "center",
                      }}
                    >
                      {/* Type badge */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                          backgroundColor: colors.brand + "15",
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                        }}
                      >
                        {app.type === "adoption" ? (
                          <Heart size={12} color={colors.brand} />
                        ) : (
                          <Home size={12} color={colors.brand} />
                        )}
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: colors.brand,
                            textTransform: "capitalize",
                          }}
                        >
                          {app.type}
                        </Text>
                      </View>

                      {/* Status badge */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                          backgroundColor: isDark ? meta.color + "20" : meta.bg,
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                        }}
                      >
                        <StatusIcon size={12} color={meta.color} />
                        <Text
                          style={{ fontSize: 12, fontWeight: "700", color: meta.color }}
                        >
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    {/* Owner notes (if any) */}
                    {app.ownerNotes ? (
                      <View
                        style={{
                          marginHorizontal: 16,
                          marginBottom: 14,
                          padding: 12,
                          backgroundColor: colors.bgSubtle,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 4 }}
                        >
                          Owner's Note
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                          {app.ownerNotes}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
