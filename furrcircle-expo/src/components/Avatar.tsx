import { View, Text, Image, StyleSheet } from "react-native";

const PALETTE = [
  "#FF6B6B", "#2563EB", "#FF6FCF", "#4CAF50", "#FFD93D",
  "#9C27B0", "#FF9800", "#00BCD4",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

type Props = {
  source?: any;        // require(...) or { uri: string }
  name?: string;       // fallback initials
  size?: number;
  style?: object;
};

export function Avatar({ source, name = "?", size = 40, style }: Props) {
  const hasImage = !!source;
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: colorFor(name) }, style]}>
      {hasImage
        ? <Image source={source} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        : <View style={styles.fallback}>
            <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
          </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  initials: { color: "#fff", fontFamily: "Poppins_700Bold" },
});
