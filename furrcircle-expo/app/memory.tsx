import { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, FlatList, useWindowDimensions } from "react-native";
import { Sparkles, Plus, X, ChevronLeft, ChevronRight } from "../src/components/ui/icons";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PageContainer } from "../src/components/PageContainer";
import { useLanguage } from "../src/lib/language-context";
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
  const { t } = useLanguage();
  const tk = useTokens();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  
  const [aura, setAura] = useState<any>(null);
  const [yearsData, setYearsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  // Index into the flat list of all photos for the full-screen viewer (null = closed)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Flat, display-ordered list of every photo URL across all year sections —
  // this is what the swipeable viewer pages through.
  const allImages = useMemo(
    () =>
      yearsData.flatMap((y) =>
        (y.grid as any[]).filter((m) => m.media_url).map((m) => m.media_url as string)
      ),
    [yearsData]
  );

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
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true);
      try {
        const uploadRes = await userApi.uploadImage(result.assets[0].uri, 'memories');
        await petApi.addPetMemory(petId, {
          media_url: uploadRes.url,
          date: new Date().toISOString(),
          title: t("newMemoryDefaultTitle"),
        });
        await loadMemories();
      } catch (err) {
        Alert.alert(t("uploadFailedTitle"), t("couldNotUploadMemoryMsg"));
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <PageContainer fullWidth={true}>
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title={t("memoryVaultHeader")} />
        
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
                    <Text style={styles.auraLabel}>{t("petAuraLabel")}</Text>
                  </View>
                  <Text style={styles.auraTitle}>{aura.zodiac} · {aura.mood}</Text>
                  <View style={styles.traitsRow}>
                    {aura.traits.map((traitName: string) => (
                      <View key={traitName} style={styles.traitChip}>
                        <Text style={styles.traitText}>{traitName}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.compatibility}>
                    <Text style={styles.compatibilityScore}>{aura.score}%</Text>
                    {" "}{t("compatibilityLabel")}
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
                <Text style={{ color: tk.textMuted, marginBottom: 12, fontFamily: "Inter_400Regular" }}>{t("noMemoriesLabel")}</Text>
                <TouchableOpacity onPress={handleAddPhoto} style={[styles.addPhotoBtn, { width: 100, height: 100, borderColor: tk.border }]}>
                  {uploading ? <ActivityIndicator color={colors.primary} /> : <Plus size={24} color={tk.textMuted} />}
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
                      onPress={() => {
                        if (!m.media_url) return;
                        const idx = allImages.indexOf(m.media_url);
                        if (idx >= 0) setViewerIndex(idx);
                      }}
                      activeOpacity={0.8}
                    >
                      {m.media_url ? (
                        <Image source={{ uri: m.media_url }} style={styles.photoImgFull} resizeMode="cover" />
                      ) : (
                        <Text style={{ color: tk.textMuted, fontSize: 10 }}>{t("noPhotoLabel")}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {/* Allow adding more photos to the current/most recent year easily */}
                  {yIndex === 0 && (
                    <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: tk.border }]} onPress={handleAddPhoto}>
                      {uploading ? <ActivityIndicator color={colors.primary} /> : <Plus size={20} color={tk.textMuted} />}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        )}
      </View>

      {/* Full Screen Swipeable Image Viewer */}
      <ImageViewer
        images={allImages}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </PageContainer>
  );
}

/**
 * Full-screen, swipeable photo viewer. Pages horizontally through `images`
 * (native swipe / drag), with prev/next arrows for web/desktop and a counter.
 */
function ImageViewer({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number | null;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);
  const [current, setCurrent] = useState(0);

  // Sync the active page when the viewer is (re)opened on a specific photo.
  useEffect(() => {
    if (index !== null) setCurrent(index);
  }, [index]);

  const goTo = (next: number) => {
    if (next < 0 || next > images.length - 1) return;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setCurrent(next);
  };

  return (
    <Modal visible={index !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fullScreenModal}>
        <FlatList
          ref={listRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={index ?? 0}
          keyExtractor={(item, i) => `${i}-${item}`}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => {
            setCurrent(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          renderItem={({ item }) => (
            <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
              <Image source={{ uri: item }} style={{ width, height: height * 0.8 }} resizeMode="contain" />
            </View>
          )}
        />

        {/* Close */}
        <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
          <X size={28} color={colors.white} />
        </TouchableOpacity>

        {/* Counter */}
        {images.length > 0 && (
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>{current + 1} / {images.length}</Text>
          </View>
        )}

        {/* Prev / Next arrows */}
        {current > 0 && (
          <TouchableOpacity style={[styles.navArrow, styles.navArrowLeft]} onPress={() => goTo(current - 1)}>
            <ChevronLeft size={28} color={colors.white} />
          </TouchableOpacity>
        )}
        {current < images.length - 1 && (
          <TouchableOpacity style={[styles.navArrow, styles.navArrowRight]} onPress={() => goTo(current + 1)}>
            <ChevronRight size={28} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
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
  fullScreenModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  closeModalBtn: { position: "absolute", top: 56, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  counterPill: { position: "absolute", top: 60, alignSelf: "center", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  counterText: { color: colors.white, fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  navArrow: { position: "absolute", top: "50%", marginTop: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  navArrowLeft: { left: 16 },
  navArrowRight: { right: 16 },
});
