import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { X, Hash } from "../src/components/ui/icons";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { useLanguage } from "../src/lib/language-context";
import { circleApi } from "../services/community/circleApi";
import { questionApi } from "../services/community/questionApi";
import { useState, useEffect } from "react";

export default function AskScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const tk = useTokens();
  const params = useLocalSearchParams<{ circleId?: string; circleName?: string }>();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(params.circleId || null);
  const [circles, setCircles] = useState<any[]>([]);
  const [loadingCircles, setLoadingCircles] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    circleApi.getMyCircles()
      .then(data => setCircles(data || []))
      .catch(() => setCircles([]))
      .finally(() => setLoadingCircles(false));
  }, []);

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert(t("requiredTitle"), t("pleaseWriteQuestionFirst"));
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const tagList = tags.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);
      await questionApi.createQuestion({
        title: title.trim(),
        body: body.trim() || undefined,
        tags: tagList,
        circleId: selectedCircleId || undefined,
      });
      // Go back — the circle/community screen will reload via useFocusEffect
      router.back();
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert(t("errorTitle"), err?.response?.data?.message || t("failedToPostQuestionMsg"));
    }
  };

  return (
    <PageContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader
          title={t("askCommunityHeaderTitle")}
          right={
            <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: tk.card }]}>
              <X size={20} color={tk.text} />
            </TouchableOpacity>
          }
          showBack={false}
        />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {/* Circle selector */}
          <Text style={[styles.label, { color: tk.textMuted }]}>{t("circleOptionalLabel")}</Text>
          {loadingCircles ? (
            <ActivityIndicator color={colors.primary} style={{ marginBottom: 8 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginBottom: 4 }}>
              <TouchableOpacity
                onPress={() => setSelectedCircleId(null)}
                style={[styles.circleBtn, { backgroundColor: !selectedCircleId ? tk.text : tk.card }]}
              >
                <Text style={[styles.circleBtnText, { color: !selectedCircleId ? tk.bg : tk.textMuted }]}>{t("globalCircleOption")}</Text>
              </TouchableOpacity>
              {circles.map((c: any) => {
                const isActive = selectedCircleId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCircleId(isActive ? null : c.id)}
                    style={[styles.circleBtn, { backgroundColor: isActive ? tk.text : tk.card }]}
                  >
                    <Text style={[styles.circleBtnText, { color: isActive ? tk.bg : tk.textMuted }]}>{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Question title */}
          <Text style={[styles.label, { color: tk.textMuted }]}>{t("questionLabel")}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("questionPlaceholder")}
            placeholderTextColor={tk.textMuted}
            style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, borderWidth: 1 }]}
          />

          {/* Details */}
          <Text style={[styles.label, { color: tk.textMuted }]}>{t("detailsOptionalLabel")}</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={6}
            placeholder={t("shareMoreContextPlaceholder")}
            placeholderTextColor={tk.textMuted}
            style={[styles.input, styles.textarea, { backgroundColor: tk.inputBg, color: tk.text, borderColor: tk.border, borderWidth: 1 }]}
          />

          {/* Tags */}
          <Text style={[styles.label, { color: tk.textMuted }]}>{t("tagsOptionalLabel")}</Text>
          <View style={[styles.tagRow, { backgroundColor: tk.inputBg, borderColor: tk.border }]}>
            <Hash size={16} color={tk.textMuted} />
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder={t("tagsPlaceholder")}
              placeholderTextColor={tk.textMuted}
              style={{ flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: tk.text, paddingVertical: 8 }}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity onPress={handlePost} disabled={submitting} style={[styles.postBtn, submitting && { opacity: 0.6 }]} activeOpacity={0.85}>
            {submitting
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.postBtnText}>{t("postQuestionBtn")}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Poppins_700Bold", fontSize: 13, marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { height: 140, textAlignVertical: "top" },
  circleBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  circleBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  postBtn: { marginTop: 24, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  postBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
