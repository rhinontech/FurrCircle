import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, Pressable, TextInput, Alert,
  KeyboardAvoidingView, Platform, Keyboard, Share, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Search, Check, LinkIcon, LogoWhatsapp, LogoInstagram, Share2, Send } from "./ui/icons";
import { Avatar } from "./Avatar";
import { colors } from "../lib/theme";
import { useTokens } from "../lib/theme-store";
import { chatApi } from "../../services/chat/chatApi";
import { userApi } from "../../services/user/userApi";
import { feedApi } from "../../services/community/feedApi";
import { useAuthStore } from "../lib/auth-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBreakpoint } from "../lib/breakpoints";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  postId?: string | null;
  petId?: string | null;
  username?: string | null;
  threadId?: string | null;
  circleId?: string | null;
  onShared?: (postId: string, shareCount: number) => void;
}

export function ShareSheet({ open, onClose, postId, petId, username, threadId, circleId, onShared }: ShareSheetProps) {
  const tk = useTokens();
  const insets = useSafeAreaInsets();
  const { isTablet } = useBreakpoint();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  
  // Real users state
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

    const [keyboardVisible, setKeyboardVisible] = useState(false);
  
    useEffect(() => {
      const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
        setKeyboardVisible(true);
      });
      const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardVisible(false);
      });
  
      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected([]);
      fetchUsers("");
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const delaySearch = setTimeout(() => {
        fetchUsers(search);
      }, 300);
      return () => clearTimeout(delaySearch);
    }
  }, [search]);

  const fetchUsers = async (query: string) => {
    setLoading(true);
    try {
      const results = await userApi.searchFollowers(query || "");
      setUsers(results.filter((u: any) => u.id !== user?.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Construct Web URLs and texts for external sharing
  let webUrl = "https://furrcircle.com";
  let shareText = "Check out FurrCircle!";
  if (postId) {
    webUrl = `https://furrcircle.com/post/${postId}`;
    shareText = "Check out this post on FurrCircle!";
  } else if (petId) {
    webUrl = `https://furrcircle.com/p/${petId}`;
    shareText = "Check out this pet profile on FurrCircle!";
  } else if (username) {
    webUrl = `https://furrcircle.com/u/${username}`;
    shareText = "Check out this profile on FurrCircle!";
  } else if (circleId) {
    webUrl = `https://furrcircle.com/circle/${circleId}`;
    shareText = "Check out this circle on FurrCircle!";
  } else if (threadId) {
    webUrl = `https://furrcircle.com/thread/${threadId}`;
    shareText = "Check out this discussion on FurrCircle!";
  }
  const fullShareText = `${shareText} ${webUrl}`;

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(webUrl);
      Alert.alert("Success", "Link copied to clipboard!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to copy link.");
    }
  };

  const handleWhatsApp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(fullShareText)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`);
      }
    } catch (err) {
      console.error(err);
      await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`);
    }
  };

  const handleTelegram = async () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(webUrl)}&text=${encodeURIComponent(shareText)}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not open Telegram.");
    }
  };

  const handleInstagram = async () => {
    const url = `instagram://camera`;
    try {
      await Clipboard.setStringAsync(webUrl);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        Alert.alert(
          "Link Copied",
          "Link copied! We will open Instagram so you can paste it in your story or messages.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Instagram", onPress: () => Linking.openURL(url) }
          ]
        );
      } else {
        Alert.alert("Link Copied", "Link copied to clipboard! You can paste it on Instagram.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Link Copied", "Link copied to clipboard! You can paste it on Instagram.");
    }
  };

  const handleSystemShare = async () => {
    try {
      await Share.share({
        message: fullShareText,
        url: webUrl,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (selected.length === 0) return;
    
    let shareLink = "";
    let typeName = "item";
    if (postId) {
      shareLink = `Check out this post! furrcircle://post/${postId}`;
      typeName = "Post";
    } else if (petId) {
      shareLink = `Check out this pet! furrcircle://pet/${petId}`;
      typeName = "Pet";
    } else if (username) {
      shareLink = `Check out this profile! furrcircle://profile/${username}`;
      typeName = "Profile";
    } else if (threadId) {
      shareLink = `Check out this discussion! furrcircle://thread/${threadId}`;
      typeName = "Discussion";
    } else if (circleId) {
      shareLink = `Check out this circle! furrcircle://circle/${circleId}`;
      typeName = "Circle";
    }
    
    if (!shareLink) return;
    
    try {
      await Promise.all(
        selected.map(recipientId => chatApi.startChat(recipientId, shareLink))
      );
      // Count the share once per recipient and let the caller update its UI.
      if (postId) {
        try {
          const res = await feedApi.sharePost(postId, selected.length);
          onShared?.(postId, res?.shareCount);
        } catch { /* non-fatal — the chat share already succeeded */ }
      }
      Alert.alert("Success", `${typeName} shared to chat!`);
    } catch (err) {
      Alert.alert("Error", `Failed to share ${typeName.toLowerCase()}.`);
    }

    onClose();
  };

  return (
    <Modal visible={open} transparent animationType={isTablet ? "fade" : "slide"} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
        style={{ flex: 1 }}
      >
        <Pressable style={[styles.overlay, isTablet && styles.overlayTablet]} onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <Pressable 
            style={[
              styles.sheet, 
              {
                paddingBottom: keyboardVisible ? 10 : 10 + insets.bottom, 
                backgroundColor: tk.glassStrong, 
                borderWidth: 1, 
                borderColor: tk.glassBorder 
              },
              !isTablet && { borderBottomWidth: 0 },
              isTablet && styles.sheetTablet
            ]} 
            onPress={Keyboard.dismiss}
          >
            <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />
            <Text style={[styles.sheetTitle, { color: tk.text }]}>Share to</Text>

          {/* Search bar */}
          <View style={[styles.searchBar, { backgroundColor: tk.glassChip, borderColor: tk.glassBorder }]}>
            <Search size={16} color={tk.textMuted} />
            <TextInput
              placeholder="Search people..."
              placeholderTextColor={tk.textMuted}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: tk.text }]}
            />
          </View>

          {/* Members list */}
          <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {loading ? (
              <Text style={[styles.emptyText, { color: tk.textMuted }]}>Loading...</Text>
            ) : users.length === 0 ? (
              <Text style={[styles.emptyText, { color: tk.textMuted }]}>
                {search.trim() ? "No followers match your search" : "You have no followers yet"}
              </Text>
            ) : (
              users.map((m) => {
                const isSelected = selected.includes(m.id);
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => toggleSelect(m.id)}
                    style={styles.memberRow}
                    activeOpacity={0.7}
                  >
                    <Avatar source={m.avatar_url ? { uri: m.avatar_url } : require("../assets/doodle-puppy.png")} name={m.name} size={40} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.memberName, { color: tk.text }]}>{m.name}</Text>
                      <Text style={[styles.memberHandle, { color: tk.textMuted }]}>@{m.username}</Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: isSelected ? colors.primary : tk.border },
                        isSelected && { backgroundColor: colors.primary },
                      ]}
                    >
                      {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Action button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={selected.length === 0}
            style={[
              styles.sendActionBtn,
              { backgroundColor: selected.length > 0 ? colors.primary : tk.border },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.sendActionText, { color: selected.length > 0 ? "#fff" : tk.textMuted }]}>
              {selected.length > 0 ? `Send to ${selected.length} friend${selected.length > 1 ? "s" : ""}` : "Select friends"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.shareDivider, { backgroundColor: tk.border }]} />

          {/* Quick share title */}
          <Text style={[styles.quickShareTitle, { color: tk.textMuted }]}>Quick Share</Text>

          {/* Quick share options */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickShareRow}>
            {/* Copy Link */}
            <TouchableOpacity onPress={handleCopyLink} style={styles.quickShareBtn} activeOpacity={0.7}>
              <View style={[styles.iconCircle, { backgroundColor: tk.glassChip }]}>
                <LinkIcon size={20} color={tk.text} />
              </View>
              <Text style={[styles.quickShareLabel, { color: tk.text }]} numberOfLines={1}>Copy Link</Text>
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity onPress={handleWhatsApp} style={styles.quickShareBtn} activeOpacity={0.7}>
              <View style={[styles.iconCircle, { backgroundColor: "#25D366" }]}>
                <LogoWhatsapp size={20} color="#fff" />
              </View>
              <Text style={[styles.quickShareLabel, { color: tk.text }]} numberOfLines={1}>WhatsApp</Text>
            </TouchableOpacity>

            {/* Instagram */}
            <TouchableOpacity onPress={handleInstagram} style={styles.quickShareBtn} activeOpacity={0.7}>
              <View style={[styles.iconCircle, { backgroundColor: "#E1306C" }]}>
                <LogoInstagram size={20} color="#fff" />
              </View>
              <Text style={[styles.quickShareLabel, { color: tk.text }]} numberOfLines={1}>Instagram</Text>
            </TouchableOpacity>

            {/* Telegram */}
            <TouchableOpacity onPress={handleTelegram} style={styles.quickShareBtn} activeOpacity={0.7}>
              <View style={[styles.iconCircle, { backgroundColor: "#0088cc" }]}>
                <Send size={18} color="#fff" style={{ marginRight: 2 }} />
              </View>
              <Text style={[styles.quickShareLabel, { color: tk.text }]} numberOfLines={1}>Telegram</Text>
            </TouchableOpacity>

            {/* More / System Share */}
            <TouchableOpacity onPress={handleSystemShare} style={styles.quickShareBtn} activeOpacity={0.7}>
              <View style={[styles.iconCircle, { backgroundColor: tk.glassChip }]}>
                <Share2 size={20} color={tk.text} />
              </View>
              <Text style={[styles.quickShareLabel, { color: tk.text }]} numberOfLines={1}>More</Text>
            </TouchableOpacity>
          </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  overlayTablet: { justifyContent: "center", alignItems: "center" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 40 },
  sheetTablet: {
    width: 500,
    borderRadius: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 16, opacity: 0.2 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, paddingHorizontal: 4, marginBottom: 12 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, gap: 8, marginBottom: 16 },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    fontFamily: "Inter_400Regular",
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  membersList: { maxHeight: 260, marginBottom: 16 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, marginVertical: 2 },
  memberName: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  memberHandle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -2 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  emptyText: { textAlign: "center", marginVertical: 20, fontFamily: "Inter_400Regular" },
  sendActionBtn: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginTop: 8 },
  sendActionText: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  shareDivider: { height: 1, marginVertical: 16, opacity: 0.2 },
  quickShareTitle: { fontSize: 11, fontFamily: "Poppins_700Bold", marginBottom: 12, paddingHorizontal: 4, textTransform: "uppercase", letterSpacing: 1 },
  quickShareRow: { flexDirection: "row", gap: 14, paddingHorizontal: 4, paddingBottom: 8 },
  quickShareBtn: { alignItems: "center", width: 72 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  quickShareLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
});
