import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { circles } from "../src/lib/demo-data";
import { useState } from "react";

export default function AskScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [circle, setCircle] = useState(circles[0].slug);

  return (
    <PageContainer>
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Ask the Community" right={
        <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: tk.card }]}>
          <X size={20} color={tk.text} />
        </TouchableOpacity>
      } showBack={false} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <Text style={[styles.label, { color: tk.textMuted }]}>Circle</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginBottom: 4 }}>
          {circles.slice(0, 5).map((c) => {
            const isActive = circle === c.slug;
            return (
              <TouchableOpacity key={c.slug} onPress={() => setCircle(c.slug)} style={[styles.circleBtn, { backgroundColor: isActive ? tk.text : tk.card }]}>
                <Text style={[styles.circleBtnText, { color: isActive ? tk.bg : tk.textMuted }]}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={[styles.label, { color: tk.textMuted }]}>Question</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="What's your question?" placeholderTextColor={tk.textMuted} style={[styles.input, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <Text style={[styles.label, { color: tk.textMuted }]}>Details (optional)</Text>
        <TextInput value={body} onChangeText={setBody} multiline numberOfLines={6} placeholder="Share more context…" placeholderTextColor={tk.textMuted} style={[styles.input, styles.textarea, { backgroundColor: tk.inputBg, color: tk.text, borderWidth: 1, borderColor: tk.border }]} />
        <TouchableOpacity onPress={() => router.back()} style={styles.postBtn} activeOpacity={0.85}>
          <Text style={styles.postBtnText}>Post question</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.foreground + "99", marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { height: 140, textAlignVertical: "top" },
  circleBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  circleBtnActive: { backgroundColor: colors.foreground },
  circleBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: colors.foreground + "88" },
  circleBtnTextActive: { color: colors.white },
  postBtn: { marginTop: 24, backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: "center" },
  postBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
});
