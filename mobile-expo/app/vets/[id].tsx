import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Clock3, MapPin, Phone, Star, Stethoscope, Bookmark, MessageCircle, MessageSquarePlus } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userDiscoverApi } from "@/services/users/discoverApi";

type Vet = {
  id: string;
  name?: string;
  clinic_name?: string;
  bio?: string;
  city?: string;
  phone?: string;
  rating?: number | string;
  specialty?: string;
  avatar_url?: string;
  hours?: string;
};

type VetReview = {
  id: string;
  userId: string;
  rating: number;
  review?: string;
  date?: string;
  user?: { id: string; name?: string; avatar_url?: string };
};

const StarRating = ({
  value,
  onSelect,
  size = 24,
}: {
  value: number;
  onSelect?: (v: number) => void;
  size?: number;
}) => (
  <View style={{ flexDirection: "row", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Pressable key={star} onPress={() => onSelect?.(star)} disabled={!onSelect}>
        <Star
          size={size}
          color="#f59e0b"
          fill={star <= value ? "#f59e0b" : "transparent"}
        />
      </Pressable>
    ))}
  </View>
);

export default function VetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const isOwner = user?.role !== "veterinarian";

  const [vet, setVet] = useState<Vet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const [reviews, setReviews] = useState<VetReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleCall = useCallback(async () => {
    if (!vet?.phone) {
      Alert.alert("Phone unavailable", "This clinic does not have a phone number yet.");
      return;
    }
    const phoneNumber = vet.phone.replace(/[^\d+]/g, "");
    const phoneUrls = [`telprompt:${phoneNumber}`, `tel:${phoneNumber}`];
    try {
      for (const phoneUrl of phoneUrls) {
        const supported = await Linking.canOpenURL(phoneUrl);
        if (supported) {
          await Linking.openURL(phoneUrl);
          return;
        }
      }

      Alert.alert("Call Clinic", `Call ${vet.clinic_name || vet.name || "this clinic"} at ${vet.phone}.`);
    } catch {
      Alert.alert("Call Clinic", `Call ${vet.clinic_name || vet.name || "this clinic"} at ${vet.phone}.`);
    }
  }, [vet?.clinic_name, vet?.name, vet?.phone]);

  const handleBookVisit = () => {
    if (!vet) return;

    router.push({
      pathname: "/appointments/book",
      params: {
        vetId: vet.id,
        vetName: vet.clinic_name || vet.name || "Vet Clinic",
      },
    } as any);
  };

  const handleMessageVet = async () => {
    if (!vet || startingChat) return;

    setStartingChat(true);
    try {
      const conversation = await userDiscoverApi.startPetInterestChat({
        recipientId: vet.id,
        recipientType: "vet",
        title: vet.clinic_name || vet.name || "Vet Clinic",
      });
      router.push(`/community/chat/${conversation.id}` as any);
    } catch (e: any) {
      Alert.alert("Unable to start chat", e.message || "Please try again in a moment.");
    } finally {
      setStartingChat(false);
    }
  };

  const fetchVet = useCallback(async () => {
    try {
      const [match, status] = await Promise.all([
        userDiscoverApi.getVetById(String(id)),
        userDiscoverApi.getSaveStatus(String(id)).catch(() => false),
      ]);
      setVet(match || null);
      setSaved(status);
    } catch {
      setVet(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await userDiscoverApi.getVetReviews(String(id));
      setReviews(data || []);
    } catch {
      // silently fail
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVet();
    fetchReviews();
  }, [fetchVet, fetchReviews]);

  const handleToggleSave = async () => {
    if (!vet) return;
    setSavingToggle(true);
    try {
      if (saved) {
        await userDiscoverApi.unsaveVet(String(id));
        setSaved(false);
      } else {
        await userDiscoverApi.saveVet(String(id));
        setSaved(true);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not update saved status.");
    } finally {
      setSavingToggle(false);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert("Select a rating", "Please select 1–5 stars before submitting.");
      return;
    }
    setSubmittingReview(true);
    try {
      const newReview = await userDiscoverApi.submitVetReview(
        String(id),
        reviewRating,
        reviewText.trim()
      );
      setReviews((prev) => {
        const without = prev.filter((r) => r.userId !== user?.id);
        return [{ ...newReview, user: { id: user?.id || "", name: user?.name, avatar_url: user?.avatar } }, ...without];
      });
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewText("");
      // Update displayed vet rating
      const allRatings = [...reviews.filter((r) => r.userId !== user?.id), newReview].map((r) => r.rating);
      const avg = allRatings.reduce((s, v) => s + v, 0) / allRatings.length;
      setVet((prev) => prev ? { ...prev, rating: Math.round(avg * 10) / 10 } : prev);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const myReview = reviews.find((r) => r.userId === user?.id);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!vet) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 20 }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>Vet not found</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>This clinic profile could not be loaded.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginRight: 14 }}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.textPrimary, flex: 1 }}>Vet Details</Text>
          {isOwner && (
            <Pressable
              onPress={handleToggleSave}
              disabled={savingToggle}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
            >
              {savingToggle
                ? <ActivityIndicator size="small" color={colors.brand} />
                : <Bookmark size={20} color={colors.brand} fill={saved ? colors.brand : "transparent"} />
              }
            </Pressable>
          )}
        </View>

        {/* Vet Profile Card */}
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {vet.avatar_url ? (
              <Image source={{ uri: vet.avatar_url }} style={{ width: 72, height: 72, borderRadius: 20 }} resizeMode="cover" />
            ) : (
              <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: colors.infoBg, alignItems: "center", justifyContent: "center" }}>
                <Stethoscope size={28} color="#0ea5e9" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>{vet.clinic_name || vet.name}</Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{vet.specialty || "General Veterinary Care"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#f59e0b" }}>
                  {vet.rating ? Number(vet.rating).toFixed(1) : "New"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>({reviews.length} reviews)</Text>
              </View>
            </View>
          </View>

          <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary, marginTop: 18 }}>
            {vet.bio || "A trusted local clinic focused on preventive care, checkups, and compassionate support for pets and families."}
          </Text>

          <View style={{ gap: 12, marginTop: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 10 }}>{vet.city || "Nearby clinic"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Clock3 size={16} color={colors.textMuted} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 10 }}>{vet.hours || "8:00 AM - 6:00 PM"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Phone size={16} color={colors.textMuted} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 10 }}>{vet.phone || "Phone unavailable"}</Text>
            </View>
          </View>

          {isOwner && (
            <View style={{ gap: 12, marginTop: 24 }}>
              <Pressable
                onPress={handleBookVisit}
                style={{ flex: 1, backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>Book Visit</Text>
              </Pressable>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={handleMessageVet}
                  disabled={startingChat}
                  style={{ flex: 1, backgroundColor: colors.bgSubtle, borderRadius: 14, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: startingChat ? 0.65 : 1 }}
                >
                  {startingChat ? <ActivityIndicator size="small" color={colors.brand} /> : <MessageCircle size={16} color={colors.textPrimary} />}
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>Message</Text>
                </Pressable>
                <Pressable
                  onPress={handleCall}
                  style={{ flex: 1, backgroundColor: colors.bgSubtle, borderRadius: 14, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                >
                  <Phone size={16} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>Call</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Reviews Section */}
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>
              Reviews
            </Text>
            {isOwner && (
              <Pressable
                onPress={() => setShowReviewModal(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brand + "15", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
              >
                <MessageSquarePlus size={14} color={colors.brand} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.brand }}>
                  {myReview ? "Edit Review" : "Write Review"}
                </Text>
              </Pressable>
            )}
          </View>

          {reviewsLoading ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : reviews.length === 0 ? (
            <View style={{ padding: 24, borderRadius: 16, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 8 }}>
              <Star size={28} color={colors.textMuted} />
              <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center" }}>
                No reviews yet. Be the first to share your experience!
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {reviews.map((r) => (
                <View
                  key={r.id}
                  style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    {r.user?.avatar_url ? (
                      <Image source={{ uri: r.user.avatar_url }} style={{ width: 36, height: 36, borderRadius: 10 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textMuted }}>
                          {r.user?.name?.[0]?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>
                        {r.user?.name || "Anonymous"}
                        {r.userId === user?.id && (
                          <Text style={{ fontSize: 12, color: colors.brand }}> (You)</Text>
                        )}
                      </Text>
                      <StarRating value={r.rating} size={13} />
                    </View>
                    {r.date && (
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>{r.date}</Text>
                    )}
                  </View>
                  {r.review ? (
                    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
                      {r.review}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#00000070", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 20 }}>
              {myReview ? "Update Your Review" : "Write a Review"}
            </Text>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 10 }}>Your Rating</Text>
            <View style={{ marginBottom: 20 }}>
              <StarRating value={reviewRating} onSelect={setReviewRating} size={32} />
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>Comments (optional)</Text>
            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Share your experience with this vet..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: colors.bg,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                fontSize: 14,
                color: colors.textPrimary,
                minHeight: 100,
                marginBottom: 20,
              }}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setShowReviewModal(false)}
                style={{ flex: 1, backgroundColor: colors.bgSubtle, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitReview}
                disabled={submittingReview || reviewRating === 0}
                style={{ flex: 2, backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 14, alignItems: "center", opacity: submittingReview || reviewRating === 0 ? 0.6 : 1 }}
              >
                {submittingReview
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Submit Review</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
