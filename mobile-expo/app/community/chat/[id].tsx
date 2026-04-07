import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, PawPrint, Send } from "lucide-react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { api } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

function formatMessageTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function CommunityChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [conversation, setConversation] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversation = async () => {
    if (!id) return;
    try {
      const data = await api.get(`/community/chats/${id}`);
      setConversation(data);
    } catch (error) {
      console.error("Error fetching conversation", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [id]);

  const handleSend = async () => {
    if (!conversation || !message.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/community/chats/${conversation.id}/messages`, {
        text: message.trim(),
        petId: conversation.pet?.id,
      });
      setConversation(res.conversation);
      setMessage("");
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  const partner =
    conversation?.otherParticipants?.[0] ||
    conversation?.participants?.find((item: any) => item.id !== user?.id);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.bgCard,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.bgSubtle,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        {partner?.avatar_url ? (
          <Image source={{ uri: partner.avatar_url }} style={{ width: 44, height: 44, borderRadius: 16 }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: colors.bgSubtle,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PawPrint size={20} color={colors.brand} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
            {conversation?.title || partner?.clinic_name || partner?.name || "Chat"}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {conversation?.pet?.name ? `About ${conversation.pet.name}` : partner?.role || "community"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 28 }}>
        {conversation?.pet && (
          <View
            style={{
              backgroundColor: colors.infoBg + "30",
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.brand + "20",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.brand, marginBottom: 4 }}>
              ADOPTION CHAT
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>{conversation.pet.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {conversation.pet.breed || conversation.pet.species} - {conversation.pet.city || "Nearby"}
            </Text>
          </View>
        )}

        {(conversation?.messages || []).map((item: any) => {
          const isMine = item.senderId === user?.id;
          return (
            <View key={item.id} style={{ alignItems: isMine ? "flex-end" : "flex-start" }}>
              <View
                style={{
                  maxWidth: "84%",
                  backgroundColor: isMine ? colors.brand : colors.bgCard,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderWidth: isMine ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                {!isMine && (
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 }}>
                    {item.sender?.name || "Member"}
                  </Text>
                )}
                <Text style={{ fontSize: 14, color: isMine ? "#fff" : colors.textPrimary, lineHeight: 20 }}>
                  {item.text}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, paddingHorizontal: 6 }}>
                {formatMessageTime(item.createdAt)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bgCard,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
          <TextInput
            placeholder="Write a message..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            style={{
              flex: 1,
              minHeight: 52,
              maxHeight: 120,
              backgroundColor: colors.bgSubtle,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.textPrimary,
              textAlignVertical: "top",
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !message.trim()}
            style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              backgroundColor: sending || !message.trim() ? colors.border : colors.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sending ? <ActivityIndicator color="#fff" /> : <Send size={20} color="#fff" />}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
