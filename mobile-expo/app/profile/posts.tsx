import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Heart, MessageCircle, Share2, FileText } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import StatusChip from "../../components/ui/StatusChip";
import { userCommunityApi } from "../../services/users/communityApi";

const statusVariant = (status: string): "success" | "info" | "danger" => {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "info";
};

export default function MyPostsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const avatar = user?.avatar ? { uri: user.avatar } : require("../../assets/pet-dog.jpg");

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const data = await userCommunityApi.getMyPosts();
      setPosts(data || []);
    } catch (e) {
      console.error("Failed to fetch my posts", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchPosts();
  }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>My Posts</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 }}>
          <FileText size={48} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>No posts yet</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>Share a story, tip, or update with the community.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        >
          {posts.map((post) => (
            <Pressable
              key={post.id}
              onPress={() => router.push({ pathname: "/community/posts/[id]", params: { id: post.id } })}
              style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{user?.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""} · {post.category || "General"}
                    </Text>
                  </View>
                </View>
                <StatusChip
                  label={post.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : "Pending"}
                  variant={statusVariant(post.status)}
                />
              </View>

              <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 22, marginBottom: 12 }} numberOfLines={4}>
                {post.content}
              </Text>

              {post.imageUrl && (
                <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: 160, borderRadius: 16, marginBottom: 12 }} resizeMode="cover" />
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Heart size={18} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{post.likes?.length ?? 0}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MessageCircle size={18} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{post.comments?.length ?? 0}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Share2 size={18} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{post.shareCount ?? 0}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
