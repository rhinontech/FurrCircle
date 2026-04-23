import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Star } from "@/components/ui/IconCompat";
import { feedbackApi } from "@/services/shared/feedbackApi";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const OWNER_TAGS = ["Behavior", "Service quality", "Clear explanation", "On time", "Care", "Clinic experience"];
const VET_TAGS = ["Polite", "On time", "Prepared", "Cooperative", "Clear communication", "Pet handled well"];

export default function AppointmentFeedbackPrompt() {
  const { isLoggedIn, user } = useAuth();
  const { colors } = useTheme();
  const [appointment, setAppointment] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const appState = useRef(AppState.currentState);
  const loadingRef = useRef(false);
  const submittingRef = useRef(false);

  const isVet = user?.role === "veterinarian";
  const tagOptions = isVet ? VET_TAGS : OWNER_TAGS;

  const copy = useMemo(() => {
    if (isVet) {
      return {
        title: "How was the pet parent?",
        subtitle: "Rate the owner behavior for this completed appointment.",
        placeholder: "Anything helpful about behavior, preparation, or communication?",
        button: "Submit owner feedback",
      };
    }

    return {
      title: "How was the vet service?",
      subtitle: "Rate the service so other pet parents can trust the right care.",
      placeholder: "Share anything about behavior, service, care, or explanation.",
      button: "Submit vet feedback",
    };
  }, [isVet]);

  const resetForm = () => {
    setRating(0);
    setTags([]);
    setComment("");
  };

  const fetchPending = useCallback(async () => {
    if (!isLoggedIn || !user?.id || loadingRef.current || submittingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const pending = await feedbackApi.getPending();
      setAppointment(pending);
      if (pending) resetForm();
    } catch {
      // Feedback should never block app usage if the network drops.
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn) {
      setAppointment(null);
      resetForm();
      return;
    }

    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    const sub = AppState.addEventListener("change", (nextState) => {
      const becameActive = appState.current.match(/inactive|background/) && nextState === "active";
      appState.current = nextState;
      if (becameActive) fetchPending();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [isLoggedIn, fetchPending]);

  const toggleTag = (tag: string) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const submit = async () => {
    if (!appointment || rating < 1 || submitting) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await feedbackApi.submit(appointment.id, {
        rating,
        tags,
        comment: comment.trim(),
      });
      setAppointment(null);
      resetForm();
      await fetchPending();
    } catch {
      // Keep the modal open so they can retry.
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const visible = !!appointment;
  const petName = appointment?.pet?.name || "the pet";
  const personName = isVet
    ? appointment?.owner?.name || "the pet parent"
    : appointment?.veterinarian?.hospital_name || appointment?.veterinarian?.name || "the vet";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.58)", justifyContent: "center", padding: 20 }}
      >
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 8, padding: 20, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>{copy.title}</Text>
          <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 20, color: colors.textSecondary }}>
            {copy.subtitle}
          </Text>
          <Text style={{ marginTop: 8, fontSize: 13, color: colors.textMuted }}>
            {petName} • {personName}
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 20 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} style={{ padding: 4 }}>
                <Star
                  size={34}
                  color={value <= rating ? "#f59e0b" : colors.border}
                  fill={value <= rating ? "#f59e0b" : "transparent"}
                />
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
            {tagOptions.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: selected ? colors.brand : colors.border,
                    backgroundColor: selected ? colors.brand : colors.bgSubtle,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? "#fff" : colors.textSecondary }}>
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={copy.placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 96,
              marginTop: 16,
              padding: 14,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.bg,
              color: colors.textPrimary,
              fontSize: 14,
              lineHeight: 20,
            }}
          />

          <Pressable
            disabled={rating < 1 || submitting}
            onPress={submit}
            style={{
              marginTop: 16,
              height: 52,
              borderRadius: 8,
              backgroundColor: colors.brand,
              opacity: rating < 1 || submitting ? 0.55 : 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
                {rating < 1 ? "Select a rating to continue" : copy.button}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
