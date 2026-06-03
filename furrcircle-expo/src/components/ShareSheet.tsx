import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, Pressable, TextInput, Alert,
  KeyboardAvoidingView, Platform, Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, Check } from "lucide-react-native";
import { Avatar } from "./Avatar";
import { colors } from "../lib/theme";
import { useTokens } from "../lib/theme-store";
import { chatApi } from "../../services/chat/chatApi";
import { userApi } from "../../services/user/userApi";
import { useAuthStore } from "../lib/auth-store";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  postId?: string | null;
  petId?: string | null;
}

export function ShareSheet({ open, onClose, postId, petId }: ShareSheetProps) {
  const tk = useTokens();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  
  // Real users state
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      const results = await userApi.searchUsers(query || "a"); // "a" just to populate something if empty
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
    }
    
    if (!shareLink) return;
    
    try {
      await Promise.all(
        selected.map(recipientId => chatApi.startChat(recipientId, shareLink))
      );
      Alert.alert("Success", `${typeName} shared to chat!`);
    } catch (err) {
      Alert.alert("Error", `Failed to share ${typeName.toLowerCase()}.`);
    }
    
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.overlay} onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <Pressable style={[styles.sheet, { backgroundColor: tk.card }]} onPress={Keyboard.dismiss}>
            <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />
            <Text style={[styles.sheetTitle, { color: tk.text }]}>Share to</Text>

          {/* Search bar */}
          <View style={[styles.searchBar, { backgroundColor: tk.bg, borderColor: tk.border }]}>
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
              <Text style={[styles.emptyText, { color: tk.textMuted }]}>No users found</Text>
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
                        { borderColor: isSelected ? colors.coral : tk.border },
                        isSelected && { backgroundColor: colors.coral },
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
              { backgroundColor: selected.length > 0 ? colors.coral : tk.border },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.sendActionText, { color: selected.length > 0 ? "#fff" : tk.textMuted }]}>
              {selected.length > 0 ? `Send to ${selected.length} friend${selected.length > 1 ? "s" : ""}` : "Select friends"}
            </Text>
          </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 16, opacity: 0.2 },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, paddingHorizontal: 4, marginBottom: 12 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  membersList: { maxHeight: 260, marginBottom: 16 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, marginVertical: 2 },
  memberName: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  memberHandle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -2 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  emptyText: { textAlign: "center", marginVertical: 20, fontFamily: "Inter_400Regular" },
  sendActionBtn: { height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginTop: 8 },
  sendActionText: { fontFamily: "Poppins_700Bold", fontSize: 15 },
});
