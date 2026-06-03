import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal } from "react-native";
import { Sparkles, Plus, X } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { petApi } from "../services/pet/petApi";
import { userApi } from "../services/user/userApi";

const trophy = require("../src/assets/icon-trophy.png");



const gridTints = [
  "rgba(255,107,107,0.15)",
  "rgba(255,217,61,0.3)",
  "rgba(37,99,235,0.1)",
  "rgba(255,111,207,0.15)",
  "rgba(76,175,80,0.15)",
  "rgba(26,26,46,0.05)",
];

export default function MemoryScreen() {
  const tk = useTokens();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  
  const [aura, setAura] = useState<any>(null);
  const [yearsData, setYearsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadMemories = async () => {
    if (!petId) return;
    try {
      const res = await petApi.getPetMemories(petId);
      setAura(res.aura);
      
      const memories = res.memories || [];
      const grouped = memories.reduce((acc: any, memory: any) => {
        const year = new Date(memory.date).getFullYear().toString();
        if (!acc[year]) acc[year] = [];
        acc[year].push(memory);
        return acc;
      }, {});
      
      const yearsList = Object.keys(grouped)
        .sort((a, b) => b.localeCompare(a))
        .map(year => ({
          year,
          grid: grouped[year]
        }));
        
      setYearsData(yearsList);
    } catch (err) {
      console.error("Failed to load memories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [petId]);

  const handleAddPhoto = async () => {
    if (!petId) return;
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true);
      try {
        const uploadRes = await userApi.uploadImage(result.assets[0].uri, 'memories');
        await petApi.addPetMemory(petId, {
          media_url: uploadRes.url,
          date: new Date().toISOString(),
          title: "New Memory", // Can add a prompt later if user wants
        });
        await loadMemories();
      } catch (err) {
        Alert.alert("Upload Failed", "Could not upload the memory. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <PageContainer>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title="Memory vault" />
        
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Aura banner */}
          {aura && (
            <View style={styles.px5}>
              <View style={styles.auraBanner}>
                <Image source={trophy} style={styles.trophyImg} resizeMode="contain" />
                <View style={{ maxWidth: "65%" }}>
                  <View style={styles.auraLabelRow}>
                    <Sparkles size={13} color={colors.white} />
                    <Text style={styles.auraLabel}>Pet aura</Text>
                  </View>
                  <Text style={styles.auraTitle}>{aura.zodiac} · {aura.mood}</Text>
                  <View style={styles.traitsRow}>
                    {aura.traits.map((t: string) => (
                      <View key={t} style={styles.traitChip}>
                        <Text style={styles.traitText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.compatibility}>
                    <Text style={styles.compatibilityScore}>{aura.score}%</Text>
                    {" "}compatibility with you
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Year sections */}
          <View style={styles.yearsWrap}>
            {/* "Add to Vault" generic button at the top if there are no memories yet, or even if there are */}
            {yearsData.length === 0 && (
              <View style={{ alignItems: "center", marginVertical: 20 }}>
                <Text style={{ color: tk.textMuted, marginBottom: 12, fontFamily: "Inter_400Regular" }}>No memories yet. Start the vault!</Text>
                <TouchableOpacity onPress={handleAddPhoto} style={[styles.addPhotoBtn, { width: 100, height: 100 }]}>
                  {uploading ? <ActivityIndicator color={colors.primary} /> : <Plus size={24} color={colors.foreground + "66"} />}
                </TouchableOpacity>
              </View>
            )}

            {yearsData.map((y, yIndex) => (
              <View key={y.year} style={styles.yearSection}>
                <Text style={[styles.yearLabel, { color: tk.text }]}>{y.year}</Text>
                <View style={styles.photoGrid}>
                  {y.grid.map((m: any, i: number) => (
                    <TouchableOpacity 
                      key={m.id || i} 
                      style={[styles.photoItem, { backgroundColor: gridTints[i % 6] }]}
                      onPress={() => { if (m.media_url) setSelectedImage(m.media_url); }}
                      activeOpacity={0.8}
                    >
                      {m.media_url ? (
                        <Image source={{ uri: m.media_url }} style={styles.photoImgFull} resizeMode="cover" />
                      ) : (
                        <Text style={{ color: tk.textMuted, fontSize: 10 }}>No Photo</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {/* Allow adding more photos to the current/most recent year easily */}
                  {yIndex === 0 && (
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
                      {uploading ? <ActivityIndicator color={colors.primary} /> : <Plus size={20} color={colors.foreground + "66"} />}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        )}
      </View>

      {/* Full Screen Image Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.fullScreenModal}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedImage(null)}>
            <X size={28} color={colors.white} />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  px5: { paddingHorizontal: 20 },
  auraBanner: { borderRadius: 28, padding: 20, backgroundColor: colors.primary, overflow: "hidden", position: "relative" },
  trophyImg: { position: "absolute", right: -10, bottom: -10, width: 110, height: 110, opacity: 0.9 },
  auraLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  auraLabel: { fontSize: 12, color: colors.white, fontFamily: "Inter_400Regular" },
  auraTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: colors.white, lineHeight: 30, marginTop: 8 },
  traitsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  traitChip: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  traitText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: colors.white },
  compatibility: { marginTop: 16, fontSize: 12, color: colors.white + "D9", fontFamily: "Inter_400Regular" },
  compatibilityScore: { fontFamily: "Poppins_700Bold", fontSize: 16, color: colors.white },
  yearsWrap: { paddingHorizontal: 20, marginTop: 24, gap: 24 },
  yearSection: {},
  yearLabel: { fontFamily: "Poppins_700Bold", fontSize: 18, marginBottom: 10 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoItem: { width: "31%", aspectRatio: 1, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  photoImg: { width: "80%", height: "80%" },
  photoImgFull: { width: "100%", height: "100%" },
  addPhotoBtn: { width: "31%", aspectRatio: 1, borderRadius: 16, borderWidth: 2, borderColor: "rgba(26,26,46,0.15)", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  fullScreenModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  closeModalBtn: { position: "absolute", top: 56, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  fullScreenImg: { width: "100%", height: "80%" },
});
