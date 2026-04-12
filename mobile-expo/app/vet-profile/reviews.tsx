import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { vetProfileApi } from "@/services/vets/profileApi";

const Stars = ({ value }: { value: number }) => (
  <View style={{ flexDirection: "row", gap: 3 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} size={14} color="#f59e0b" fill={star <= value ? "#f59e0b" : "transparent"} />
    ))}
  </View>
);

export default function VetReviewsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      setReviews(await vetProfileApi.getMyReviews(user.id));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const average = useMemo(() => {
    if (reviews.length === 0) return null;
    return Math.round((reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>My Reviews</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
        >
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.textPrimary }}>{average == null ? "New" : average.toFixed(1)}</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>{reviews.length} review{reviews.length === 1 ? "" : "s"} from pet parents</Text>
          </View>

          {reviews.length === 0 ? (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 28, alignItems: "center", gap: 10 }}>
              <Star size={34} color={colors.textMuted} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary }}>No reviews yet</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>Reviews appear after owners complete appointments and share feedback.</Text>
            </View>
          ) : reviews.map((review) => (
            <View key={review.id} style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                {review.user?.avatar_url ? (
                  <Image source={{ uri: review.user.avatar_url }} style={{ width: 38, height: 38, borderRadius: 12 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: colors.textMuted, fontWeight: "700" }}>{review.user?.name?.[0]?.toUpperCase() || "?"}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>{review.user?.name || "Pet parent"}</Text>
                  <Stars value={Number(review.rating || 0)} />
                </View>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{review.date || ""}</Text>
              </View>
              {!!review.review && <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>{review.review}</Text>}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
