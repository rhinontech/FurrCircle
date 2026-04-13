import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ChevronLeft, MessageCircle, PawPrint, Send } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { userCommunityApi } from "@/services/users/communityApi";

function timeAgo(date?: string) {
  if (!date) return "";
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "just now";
}

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { markChatsRead } = useNotifications();
  const { colors } = useTheme();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const data = await userCommunityApi.getChats();
      setChats(data || []);
      await markChatsRead();
    } catch (error) {
      console.error("Error fetching chats", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [markChatsRead]);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.textPrimary, textAlign: "center", marginRight: 40 }}>
          Chats
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {chats.length === 0 ? (
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingVertical: 42, alignItems: "center" }}>
            <MessageCircle size={42} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={{ marginTop: 14, fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>No chats yet</Text>
            <Text style={{ marginTop: 8, fontSize: 13, color: colors.textMuted, textAlign: "center", paddingHorizontal: 32, lineHeight: 20 }}>
              Conversations from adoption requests and direct messages will appear here.
            </Text>
          </View>
        ) : (
          chats.map((chat) => {
            const partner = chat.otherParticipants?.[0] || chat.participants?.find((item: any) => item.id !== user?.id);
            const lastMessage = chat.lastMessage;
            return (
              <Pressable
                key={chat.id}
                onPress={() => router.push(`/community/chat/${chat.id}` as any)}
                style={{ backgroundColor: colors.bgCard, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                {partner?.avatar_url ? (
                  <Image source={{ uri: partner.avatar_url }} style={{ width: 52, height: 52, borderRadius: 8 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                    <PawPrint size={22} color={colors.brand} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, flex: 1, marginRight: 8 }}>
                      {chat.title || partner?.clinic_name || partner?.name || "Conversation"}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>{timeAgo(lastMessage?.createdAt)}</Text>
                  </View>
                  <Text numberOfLines={1} style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>
                    {chat.pet?.name ? `About ${chat.pet.name}` : partner?.role === "veterinarian" ? "Vet support chat" : "Direct message"}
                  </Text>
                  <Text numberOfLines={2} style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 18 }}>
                    {lastMessage?.text || "No messages yet"}
                  </Text>
                </View>
                <Send size={18} color={colors.brand} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
