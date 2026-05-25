import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Avatar } from "../src/components/Avatar";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";

const notifications = [
  { id: "n1", from: "Aanya P.",         body: "liked your post",                     meta: "Moona's Sunday park dump · 2m",         img: require("../src/assets/doodle-cat.png"),      dot: colors.coral },
  { id: "n2", from: "Mehul S.",         body: "commented: \"Which park is this?\"",  meta: "15m ago",                               img: require("../src/assets/doodle-birthday.png"), dot: colors.primary },
  { id: "n3", from: "Indie Dogs India", body: "has 3 new discussions",               meta: "1h ago",                                img: require("../src/assets/doodle-group.png"),    dot: colors.sunshine },
  { id: "n4", from: "Health Reminder",  body: "Moona's Bordetella vaccine is due",   meta: "2h ago",                                img: require("../src/assets/doodle-vet.png"),       dot: colors.success },
  { id: "n5", from: "128 people",       body: "upvoted your thread",                 meta: "Dog anxiety during fireworks · 5h",     img: require("../src/assets/doodle-walk.png"),      dot: colors.pinky },
  { id: "n6", from: "Rohan K.",         body: "started following you",               meta: "Yesterday",                             img: require("../src/assets/doodle-rescue.png"),    dot: colors.primary },
];

export default function NotificationsScreen() {
  const tk = useTokens();
  return (
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader title="Notifications" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {notifications.map((n) => (
          <TouchableOpacity key={n.id} style={[styles.row, { backgroundColor: tk.card, borderBottomColor: tk.border }]} activeOpacity={0.8}>
            <View style={styles.avatarWrap}>
              <Avatar source={n.img} name={n.from} size={48} />
              <View style={[styles.dotBadge, { backgroundColor: n.dot }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { color: tk.text }]}>
                <Text style={styles.fromBold}>{n.from} </Text>{n.body}
              </Text>
              <Text style={[styles.meta, { color: tk.textMuted }]}>{n.meta}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  avatarWrap: { position: "relative" },
  dotBadge: { position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#fff" },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  fromBold: { fontFamily: "Poppins_700Bold" },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
