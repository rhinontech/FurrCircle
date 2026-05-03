import React, { useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { useRouter } from "expo-router";
import { ChevronLeft, Check } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userCommunityApi } from "@/services/users/communityApi";

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Other"];
const TOPICS = ["Health", "Adoption", "Training", "Nutrition", "Lost & Found"];

export default function FeedInterestsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();

  const [petTypes, setPetTypes] = useState<string[]>(user?.petTypeInterests || []);
  const [topics, setTopics] = useState<string[]>(user?.topicInterests || []);
  const [saving, setSaving] = useState(false);

  const toggle = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userCommunityApi.updateInterests({ petTypeInterests: petTypes, topicInterests: topics });
      await refreshUser();
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save interests");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.textPrimary, flex: 1 }}>Feed Interests</Text>
        </View>

        <Text style={{ fontSize: 14, color: colors.textMuted, paddingHorizontal: 20, marginBottom: 28, lineHeight: 20 }}>
          Choose what you care about. Your "For You" feed will prioritize matching posts.
        </Text>

        {/* My Pets section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>My Pets</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {PET_TYPES.map((pt) => {
              const selected = petTypes.includes(pt);
              return (
                <Pressable
                  key={pt}
                  onPress={() => toggle(pt, petTypes, setPetTypes)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.brand : colors.bgSubtle,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.brand : colors.border,
                  }}
                >
                  {selected && <Check size={13} color="#fff" />}
                  <Text style={{ fontSize: 14, fontWeight: "600", color: selected ? "#fff" : colors.textPrimary }}>{pt}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Topics section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>Topics</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {TOPICS.map((topic) => {
              const selected = topics.includes(topic);
              return (
                <Pressable
                  key={topic}
                  onPress={() => toggle(topic, topics, setTopics)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.brand : colors.bgSubtle,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.brand : colors.border,
                  }}
                >
                  {selected && <Check size={13} color="#fff" />}
                  <Text style={{ fontSize: 14, fontWeight: "600", color: selected ? "#fff" : colors.textPrimary }}>{topic}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {petTypes.length === 0 && topics.length === 0 && (
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", marginBottom: 16, paddingHorizontal: 20 }}>
            No selection = "For You" falls back to Trending posts.
          </Text>
        )}
      </ScrollView>

      {/* Save button */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: colors.brand, borderRadius: 16, paddingVertical: 16, alignItems: "center", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Interests</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
