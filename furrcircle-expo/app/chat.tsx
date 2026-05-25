import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Avatar } from "../src/components/Avatar";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { Send } from "lucide-react-native";
import { useState } from "react";

const conversations = [
  { id: "c1", name: "Aanya P.",          lastMsg: "She looks SO happy 😭",              time: "1h",  unread: 2, img: require("../src/assets/doodle-cat.png") },
  { id: "c2", name: "Mehul S.",           lastMsg: "Which park is this?",                time: "2h",  unread: 0, img: require("../src/assets/doodle-birthday.png") },
  { id: "c3", name: "Indie Dogs India",   lastMsg: "Reposting this on our story 🐾",    time: "45m", unread: 1, img: require("../src/assets/doodle-group.png") },
  { id: "c4", name: "Priya M.",           lastMsg: "Goals. Sunday goals.",               time: "1d",  unread: 0, img: require("../src/assets/doodle-walk.png") },
];

export default function ChatScreen() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const tk = useTokens();

  if (selectedChat) {
    const chat = conversations.find((c) => c.id === selectedChat)!;
    return (
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader title={chat.name} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={styles.msgRowOther}>
            <Avatar source={chat.img} name={chat.name} size={32} />
            <View style={[styles.bubbleOther, { backgroundColor: tk.card }]}>
              <Text style={[styles.bubbleText, { color: tk.text }]}>{chat.lastMsg}</Text>
            </View>
          </View>
          <View style={styles.msgRowMe}>
            <View style={styles.bubbleMe}>
              <Text style={[styles.bubbleText, { color: "#fff" }]}>Hey! Which trail was this?</Text>
            </View>
          </View>
        </ScrollView>
        <View style={[styles.inputBar, { backgroundColor: tk.card, borderTopColor: tk.border }]}>
          <TextInput value={msg} onChangeText={setMsg} placeholder="Message…"
            placeholderTextColor={tk.textMuted} style={[styles.msgInput, { backgroundColor: tk.bg, color: tk.text }]} />
          <TouchableOpacity style={styles.sendBtn}><Send size={18} color="#fff" /></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Messages" />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {conversations.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => setSelectedChat(c.id)}
            style={[styles.chatRow, { backgroundColor: tk.card, borderBottomColor: tk.border }]} activeOpacity={0.8}>
            <View style={styles.avatarWrap}>
              <Avatar source={c.img} name={c.name} size={50} />
              {c.unread > 0 && <View style={styles.unreadDot}><Text style={styles.unreadText}>{c.unread}</Text></View>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatName, { color: tk.text }]}>{c.name}</Text>
              <Text style={[styles.chatLastMsg, { color: tk.textMuted }]} numberOfLines={1}>{c.lastMsg}</Text>
            </View>
            <Text style={[styles.chatTime, { color: tk.textMuted }]}>{c.time}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  avatarWrap: { position: "relative" },
  chatName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  chatLastMsg: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  chatTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  unreadDot: { position: "absolute", top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.coral, alignItems: "center", justifyContent: "center" },
  unreadText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: "#fff" },
  msgRowOther: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowMe: { flexDirection: "row", justifyContent: "flex-end" },
  bubbleOther: { borderRadius: 20, borderBottomLeftRadius: 4, padding: 14, maxWidth: "75%", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  bubbleMe: { borderRadius: 20, borderBottomRightRadius: 4, padding: 14, maxWidth: "75%", backgroundColor: colors.primary },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  msgInput: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
