import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Image as ImageIcon, Hash, MapPin, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";

const types = ["Photo", "Reel", "Milestone", "Rescue story"] as const;
const pets = [
  { name: "Moona", tint: "rgba(255,107,107,0.15)" },
  { name: "Kobi", tint: "rgba(37,99,235,0.1)" },
] as const;

export default function ComposeScreen() {
  const router = useRouter();
  const tk = useTokens();
  const [type, setType] = useState<(typeof types)[number]>("Photo");
  const [pet, setPet] = useState<"Moona" | "Kobi">("Moona");
  const [caption, setCaption] = useState("");

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    // photo picked — could store uri if needed
  };

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        {/* Custom header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.white }]}>
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tk.text }]}>New post</Text>
          <TouchableOpacity style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
          {/* Type chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
            {types.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[styles.chip, type === t ? styles.chipActive : { backgroundColor: colors.white }]}
              >
                <Text style={[styles.chipText, type === t ? { color: colors.white } : { color: colors.foreground + "AA" }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Posting as */}
          <Text style={[styles.sectionLabel, { color: tk.textMuted }]}>Posting as</Text>
          <View style={styles.petRow}>
            {pets.map((p) => (
              <TouchableOpacity
                key={p.name}
                onPress={() => setPet(p.name)}
                style={[styles.petChip, pet === p.name ? styles.petChipActive : { backgroundColor: colors.white }]}
              >
                <View style={[styles.petAvatar, { backgroundColor: p.tint }]} />
                <Text style={[styles.petName, pet === p.name ? { color: colors.white } : { color: colors.foreground }]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Photo grid */}
          <View style={styles.photoGrid}>
            <TouchableOpacity onPress={pickPhoto} style={styles.addPhotoBtn}>
              <ImageIcon size={24} color={colors.foreground + "66"} />
              <Text style={styles.addPhotoLabel}>Add</Text>
            </TouchableOpacity>
            <View style={[styles.photoPlaceholder, { backgroundColor: "rgba(255,107,107,0.2)" }]} />
            <View style={[styles.photoPlaceholder, { backgroundColor: "rgba(255,217,61,0.3)" }]} />
          </View>

          {/* Caption */}
          <TextInput
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
            placeholder="Tell the circle what's happening…"
            placeholderTextColor={colors.foreground + "66"}
            style={[styles.captionInput, { backgroundColor: colors.white, color: tk.text }]}
          />

          {/* Tags & Location rows */}
          <View style={styles.rowsWrap}>
            <MetaRow icon={Hash} label="Add tags" value="#bordercollie  #mumbaipets" tk={tk} />
            <MetaRow icon={MapPin} label="Location" value="Joggers Park, Mumbai" tk={tk} />
          </View>
        </ScrollView>
      </View>
    </PageContainer>
  );
}

function MetaRow({ icon: Icon, label, value, tk }: { icon: any; label: string; value: string; tk: any }) {
  return (
    <TouchableOpacity style={[styles.metaRow, { backgroundColor: colors.white }]}>
      <View style={[styles.metaIcon, { backgroundColor: colors.surface }]}>
        <Icon size={16} color={colors.foreground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.metaLabel, { color: tk.text }]}>{label}</Text>
        <Text style={[styles.metaValue, { color: tk.textMuted }]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  shareBtn: { backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  shareBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: colors.white },
  chipsScroll: { flexGrow: 0, marginBottom: 16 },
  chipsContent: { gap: 8, paddingBottom: 4 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.foreground },
  chipText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 14, marginBottom: 10 },
  petRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  petChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  petChipActive: { backgroundColor: colors.foreground },
  petAvatar: { width: 28, height: 28, borderRadius: 14 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  photoGrid: { flexDirection: "row", gap: 8, marginBottom: 20 },
  addPhotoBtn: { flex: 1, aspectRatio: 1, borderRadius: 16, borderWidth: 2, borderColor: "rgba(26,26,46,0.15)", borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.white },
  addPhotoLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: colors.foreground + "99" },
  photoPlaceholder: { flex: 1, aspectRatio: 1, borderRadius: 16 },
  captionInput: { borderRadius: 16, padding: 16, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 110, textAlignVertical: "top", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 12 },
  rowsWrap: { gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  metaIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  metaLabel: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  metaValue: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});
