import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, Pressable, TextInput, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, Check } from "lucide-react-native";
import { Avatar } from "./Avatar";
import { colors } from "../lib/theme";
import { useTokens } from "../lib/theme-store";

export const shareMembers = [
  { id: "1", name: "Aanya P.", handle: "aanya", avatar: require("../assets/doodle-cat.png") },
  { id: "2", name: "Mehul S.", handle: "mehul", avatar: require("../assets/doodle-birthday.png") },
  { id: "3", name: "Priya M.", handle: "priya", avatar: require("../assets/doodle-walk.png") },
  { id: "4", name: "Indie Dogs India", handle: "indiedogs", avatar: require("../assets/doodle-group.png") },
  { id: "5", name: "Rescue & Co.", handle: "rescueco", avatar: require("../assets/doodle-rescue.png") },
];

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  postId: string | null;
}

export function ShareSheet({ open, onClose, postId }: ShareSheetProps) {
  const tk = useTokens();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected([]);
    }
  }, [open]);

  const filtered = shareMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.handle.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = () => {
    if (selected.length === 0) return;
    const names = shareMembers
      .filter((m) => selected.includes(m.id))
      .map((m) => m.name)
      .join(", ");
    Alert.alert("Success", `Post shared with: ${names}`);
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: tk.card }]} onStartShouldSetResponder={() => true}>
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
            {filtered.length === 0 ? (
              <Text style={[styles.emptyText, { color: tk.textMuted }]}>No members found</Text>
            ) : (
              filtered.map((m) => {
                const isSelected = selected.includes(m.id);
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => toggleSelect(m.id)}
                    style={styles.memberRow}
                    activeOpacity={0.7}
                  >
                    <Avatar source={m.avatar} name={m.name} size={40} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.memberName, { color: tk.text }]}>{m.name}</Text>
                      <Text style={[styles.memberHandle, { color: tk.textMuted }]}>@{m.handle}</Text>
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
        </View>
      </Pressable>
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
