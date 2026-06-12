import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Heart, MessageCircle, Share2, X } from "../src/components/ui/icons";
import { colors } from "../src/lib/theme";

const { height, width } = Dimensions.get("window");

const reelItems = [
  { id: "r1", pet: "Moona", owner: "Goutham R.", caption: "Sunday zoomies 🌀", likes: 1240, comments: 89, tintColor: "rgba(255,107,107,0.25)" },
  { id: "r2", pet: "Mochi", owner: "Aanya P.", caption: "Window mode: activated 🪟", likes: 870, comments: 45, tintColor: "rgba(37,99,235,0.15)" },
];

export default function ReelsScreen() {
  const router = useRouter();
  const reel = reelItems[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.foreground }]}>
      <View style={[styles.reelBg, { backgroundColor: reel.tintColor }]} />
      <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
        <X size={24} color={colors.white} />
      </TouchableOpacity>
      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionItem}>
          <Heart size={28} color={colors.white} fill="rgba(255,255,255,0.9)" />
          <Text style={styles.actionCount}>{reel.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <MessageCircle size={28} color={colors.white} />
          <Text style={styles.actionCount}>{reel.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Share2 size={28} color={colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.bottomInfo}>
        <Text style={styles.petName}>{reel.pet}</Text>
        <Text style={styles.caption}>{reel.caption}</Text>
        <Text style={styles.owner}>@{reel.owner}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end" },
  reelBg: { ...StyleSheet.absoluteFillObject },
  closeBtn: { position: "absolute", top: 56, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  sideActions: { position: "absolute", right: 16, bottom: 120, gap: 20 },
  actionItem: { alignItems: "center", gap: 4 },
  actionCount: { fontFamily: "Poppins_700Bold", fontSize: 13, color: colors.white },
  bottomInfo: { paddingHorizontal: 20, paddingBottom: 48, gap: 4 },
  petName: { fontFamily: "Poppins_700Bold", fontSize: 18, color: colors.white },
  caption: { fontSize: 14, color: "rgba(255,255,255,0.9)", fontFamily: "Inter_400Regular" },
  owner: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_600SemiBold" },
});
