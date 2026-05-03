import React from "react";
import { View, Image, Pressable, FlatList } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";
import { Plus, Eye } from "@/components/ui/IconCompat";
import { useTheme } from "@/contexts/ThemeContext";
import type { StoryGroup, MyStoryResponse } from "@/services/users/communityApi";

interface Props {
  storyGroups: StoryGroup[];
  myStory: MyStoryResponse | null;
  currentUserId: string;
  onPressStory: (group: StoryGroup, startIndex: number) => void;
  onPressMyStory: () => void;
  onPressAddStory: () => void;
  currentUserAvatar?: string | null;
  currentUserName?: string;
}

const BUBBLE_SIZE = 68;
const RING_WIDTH = 3;

export default function StoriesBar({
  storyGroups,
  myStory,
  currentUserId,
  onPressStory,
  onPressMyStory,
  onPressAddStory,
  currentUserAvatar,
  currentUserName,
}: Props) {
  const { colors } = useTheme();

  const otherGroups = storyGroups.filter((g) => g.userId !== currentUserId);

  const renderMyStory = () => {
    const hasStory = myStory && myStory.stories.length > 0;

    return (
      <Pressable
        onPress={hasStory ? onPressMyStory : onPressAddStory}
        style={{ alignItems: "center", width: BUBBLE_SIZE + 16, marginRight: 4 }}
      >
        <View
          style={{
            width: BUBBLE_SIZE,
            height: BUBBLE_SIZE,
            borderRadius: BUBBLE_SIZE / 2,
            padding: RING_WIDTH,
            backgroundColor: hasStory ? colors.brand : colors.border,
          }}
        >
          <View style={{ flex: 1, borderRadius: (BUBBLE_SIZE - RING_WIDTH * 2) / 2, overflow: "hidden", backgroundColor: colors.bgSubtle }}>
            {currentUserAvatar ? (
              <Image source={{ uri: currentUserAvatar }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20, color: colors.textMuted }}>
                  {(currentUserName || "?")[0]?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {!hasStory && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.brand,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.bgCard,
              }}
            >
              <Plus size={12} color="#fff" />
            </View>
          )}

          {hasStory && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                minWidth: 22,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.brand,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
                borderWidth: 2,
                borderColor: colors.bgCard,
                flexDirection: "row",
                gap: 2,
              }}
            >
              <Eye size={9} color="#fff" />
              <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>{myStory!.totalViews}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: "center" }} numberOfLines={1}>
          {hasStory ? "My Story" : "Add Story"}
        </Text>
      </Pressable>
    );
  };

  const renderStoryBubble = ({ item }: { item: StoryGroup }) => {
    const hasUnviewed = item.stories.some((s) => !s.viewedByMe);
    const ringColor = hasUnviewed ? colors.brand : colors.border;

    return (
      <Pressable
        onPress={() => onPressStory(item, 0)}
        style={{ alignItems: "center", width: BUBBLE_SIZE + 16, marginRight: 4 }}
      >
        <View
          style={{
            width: BUBBLE_SIZE,
            height: BUBBLE_SIZE,
            borderRadius: BUBBLE_SIZE / 2,
            padding: RING_WIDTH,
            backgroundColor: ringColor,
          }}
        >
          <View style={{ flex: 1, borderRadius: (BUBBLE_SIZE - RING_WIDTH * 2) / 2, overflow: "hidden", backgroundColor: colors.bgSubtle }}>
            {item.author?.avatar_url ? (
              <Image source={{ uri: item.author.avatar_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20, color: colors.textMuted }}>
                  {(item.author?.name || "?")[0]?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: "center" }} numberOfLines={1}>
          {item.author?.name?.split(" ")[0] || "User"}
        </Text>
      </Pressable>
    );
  };

  if (otherGroups.length === 0 && (!myStory || myStory.stories.length === 0)) {
    return (
      <View style={{ paddingVertical: 4, paddingHorizontal: 20, marginBottom: 16 }}>
        {renderMyStory()}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={otherGroups}
        keyExtractor={(item) => item.userId}
        renderItem={renderStoryBubble}
        ListHeaderComponent={renderMyStory()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4 }}
      />
    </View>
  );
}
