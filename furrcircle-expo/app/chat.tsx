import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Pressable
} from "react-native";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Avatar } from "../src/components/Avatar";
import { colors } from "../src/lib/theme";
import { useTokens } from "../src/lib/theme-store";
import { Send, Plus, Search, MessageCircle } from "lucide-react-native";
import { useAuthStore } from "../src/lib/auth-store";
import { chatApi } from "../services/chat/chatApi";
import { userApi } from "../services/user/userApi";
import { socketService } from "../services/socket/socketService";
import { useNotificationStore } from "../src/lib/notification-store";
import { useRouter, useLocalSearchParams } from "expo-router";

// --- Helpers ---
const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
  return `${hours}:${minutes} ${ampm}`;
};

const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return formatTime(dateStr);
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const getDateGroup = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (d.toDateString() === now.toDateString()) return "Today";

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

// --- Main Component ---
export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [selectedChat, setSelectedChat] = useState<string | null>(params.id || null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const tk = useTokens();
  const { user } = useAuthStore();
  const clearChatUnread = useNotificationStore((s) => s.clearChatUnread);

  // --- List View Methods ---
  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getChats();
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedChat) {
      loadConversations();
    }
  }, [selectedChat]);

  // Handle global socket events for list view
  useEffect(() => {
    const unsub = socketService.on("chat:message", (data: any) => {
      // If we're in the list view, just reload conversations to get the latest message and sort order
      if (!selectedChat) {
        loadConversations();
      }
    });
    return () => unsub();
  }, [selectedChat]);

  // Sync URL params to selected chat
  useEffect(() => {
    if (params.id) {
      setSelectedChat(params.id);
    }
  }, [params.id]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    setSearchLoading(true);
    try {
      const results = await userApi.searchUsers(text || "a");
      setSearchResults(results.filter((u: any) => u.id !== user?.id));
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (isNewChatOpen) {
      setSearchQuery("");
      handleSearch(""); // Fetches default list
    }
  }, [isNewChatOpen]);

  const handleStartNewChat = async (recipientId: string) => {
    setIsNewChatOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    try {
      const conv = await chatApi.startChat(recipientId);
      setSelectedChat(conv.id);
    } catch (e) {
      console.error("Failed to start chat", e);
    }
  };

  // --- Detail View Methods ---
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [chatDetail, setChatDetail] = useState<any>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (selectedChat) {
      loadMessages();
      clearChatUnread(); // Mark all chats read when opening a specific chat
      // Also inform the backend
      chatApi.markChatAsRead(selectedChat).catch(() => { });
    }
  }, [selectedChat]);

  const loadMessages = async () => {
    if (!selectedChat) return;
    try {
      setLoadingMessages(true);
      const conv = await chatApi.getChatById(selectedChat);
      setChatDetail(conv);
      setMessages(conv.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle socket events for detail view
  useEffect(() => {
    if (!selectedChat) return;
    const unsub = socketService.on("chat:message", (data: any) => {
      if (data.conversationId === selectedChat && data.message) {
        setMessages((prev) => [...prev, data.message]);
        clearChatUnread(); // Keep unread count 0 while actively in chat
      }
    });
    return () => unsub();
  }, [selectedChat]);

  const handleSend = async () => {
    if (!msgInput.trim() || !selectedChat) return;
    const textToSend = msgInput.trim();
    setMsgInput(""); // Optimistic clear

    try {
      await chatApi.sendMessage(selectedChat, textToSend);
      // We don't manually append here because the backend emits `chat:message` to the sender too,
      // which our socket listener above will catch and append.
    } catch (e) {
      console.error("Send failed", e);
      setMsgInput(textToSend); // Revert on failure
    }
  };

  const getOtherParticipant = (conv: any) => {
    if (!conv) return null;
    if (conv.otherParticipants && conv.otherParticipants.length > 0) {
      return conv.otherParticipants[0];
    }
    return conv.initiator?.id === user?.id ? conv.recipient : conv.initiator;
  };

  // --- Message Content Renderer ---
  const renderMessageContent = (text: string, isMe: boolean, tk: any, router: any) => {
    const match = text.match(/furrcircle:\/\/post\/([A-Za-z0-9-]+)/);
    if (match) {
      const postId = match[1];
      const prefixText = text.replace(match[0], "").trim();

      return (
        <View>
          {prefixText ? <Text style={[styles.bubbleText, { color: isMe ? "#fff" : tk.text, marginBottom: 8 }]}>{prefixText}</Text> : null}
          <TouchableOpacity
            onPress={() => router.push(`/post/${postId}`)}
            style={{ backgroundColor: isMe ? "rgba(255,255,255,0.2)" : tk.border, padding: 12, borderRadius: 12, alignItems: "center" }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: "Poppins_600SemiBold", color: isMe ? "#fff" : tk.text, fontSize: 13 }}>View Shared Post</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const petMatch = text.match(/furrcircle:\/\/pet\/([A-Za-z0-9-]+)/);
    if (petMatch) {
      const petId = petMatch[1];
      const prefixText = text.replace(petMatch[0], "").trim();

      return (
        <View>
          {prefixText ? <Text style={[styles.bubbleText, { color: isMe ? "#fff" : tk.text, marginBottom: 8 }]}>{prefixText}</Text> : null}
          <TouchableOpacity
            onPress={() => router.push(`/p/${petId}`)}
            style={{ backgroundColor: isMe ? "rgba(255,255,255,0.2)" : tk.border, padding: 12, borderRadius: 12, alignItems: "center" }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: "Poppins_600SemiBold", color: isMe ? "#fff" : tk.text, fontSize: 13 }}>View Shared Pet</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <Text style={[styles.bubbleText, { color: isMe ? "#fff" : tk.text }]}>{text}</Text>;
  };

  // Group messages by date for dividers (must be at top level to follow Rules of Hooks)
  const groupedMessages = useMemo(() => {
    if (!selectedChat) return [];
    const groups: { [key: string]: any[] } = {};
    messages.forEach(m => {
      const d = getDateGroup(m.createdAt);
      if (!groups[d]) groups[d] = [];
      groups[d].push(m);
    });
    // Flatten into renderable array with dividers
    const result: any[] = [];
    Object.keys(groups).forEach(date => {
      result.push({ type: 'divider', text: date, id: `div-${date}` });
      result.push(...groups[date].map(m => ({ ...m, type: 'message' })));
    });
    return result.reverse(); // FlatList inverted expects newest first
  }, [messages, selectedChat]);

  // --- Render Detail View ---
  if (selectedChat) {
    const otherUser = getOtherParticipant(chatDetail) || { name: "Loading...", avatar_url: null };

    return (
      <View style={[styles.container, { backgroundColor: tk.bg }]}>
        <ScreenHeader
          title={otherUser.name}
          onBack={() => {
            setSelectedChat(null);
            // Optionally clear the query param so refresh doesn't stick inside
            router.setParams({ id: "" });
          }}
          right={
            <TouchableOpacity onPress={() => otherUser.username && router.push(`/u/${otherUser.username}`)}>
              <Avatar source={otherUser.avatar_url ? { uri: otherUser.avatar_url } : require("../src/assets/doodle-puppy.png")} name={otherUser.name} size={32} />
            </TouchableOpacity>
          }
        />

        {loadingMessages ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            inverted
            data={groupedMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => {
              if (item.type === 'divider') {
                return (
                  <View style={styles.dateDivider}>
                    <Text style={[styles.dateDividerText, { color: tk.textMuted }]}>{item.text}</Text>
                  </View>
                );
              }

              const isMe = item.sender?.id === user?.id;
              return (
                <View style={isMe ? styles.msgRowMe : styles.msgRowOther}>
                  {!isMe && (
                    <TouchableOpacity onPress={() => otherUser.username && router.push(`/u/${otherUser.username}`)}>
                      <Avatar source={otherUser.avatar_url ? { uri: otherUser.avatar_url } : require("../src/assets/doodle-puppy.png")} name={otherUser.name} size={28} />
                    </TouchableOpacity>
                  )}
                  <View style={[
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                    !isMe && { backgroundColor: tk.card }
                  ]}>
                    {renderMessageContent(item.text, isMe, tk, router)}
                    <Text style={[styles.timeText, { color: isMe ? "rgba(255,255,255,0.7)" : tk.textMuted, textAlign: isMe ? "right" : "left" }]}>
                      {formatTime(item.createdAt)}{isMe && (item.readAt || item.seen ? " ✓✓" : " ✓")}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.inputBar, { backgroundColor: tk.card, borderTopColor: tk.border }]}>
            <TextInput
              value={msgInput}
              onChangeText={setMsgInput}
              placeholder="Message…"
              placeholderTextColor={tk.textMuted}
              style={[styles.msgInput, { backgroundColor: tk.bg, color: tk.text }]}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: msgInput.trim() ? colors.primary : tk.border }]}
              onPress={handleSend}
              disabled={!msgInput.trim()}
            >
              <Send size={18} color={msgInput.trim() ? "#fff" : tk.textMuted} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // --- Render List View ---
  return (
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader
        title="Messages"
        right={
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: tk.card }]}
            onPress={() => setIsNewChatOpen(true)}
          >
            <Plus size={22} color={tk.text} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: tk.card, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <MessageCircle size={40} color={tk.textMuted} />
          </View>
          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 18, color: tk.text, textAlign: "center" }}>No messages yet</Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, textAlign: "center", marginTop: 8 }}>
            Start a conversation with a friend or a vet!
          </Text>
          <TouchableOpacity
            style={[styles.startChatBtn, { backgroundColor: colors.primary }]}
            onPress={() => setIsNewChatOpen(true)}
          >
            <Text style={{ fontFamily: "Poppins_600SemiBold", color: "#fff" }}>New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item: c }) => {
            const otherUser = getOtherParticipant(c);
            if (!otherUser) return null;

            // Determine if there's unread logic here if we add lastRead marker, for now we just show it
            // if we have unread badge and the last message isn't ours. We'll simplify.
            const hasUnread = c.unreadCount > 0 || (c.lastMessage && !c.lastMessage.readAt && !c.lastMessage.seen && c.lastMessage.sender?.id !== user?.id);

            return (
              <TouchableOpacity
                onPress={() => setSelectedChat(c.id)}
                style={[styles.chatRow, { backgroundColor: tk.card, borderBottomColor: tk.border }]}
                activeOpacity={0.8}
              >
                <View style={styles.avatarWrap}>
                  <Avatar source={otherUser.avatar_url ? { uri: otherUser.avatar_url } : require("../src/assets/doodle-puppy.png")} name={otherUser.name} size={50} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chatName, { color: tk.text, fontFamily: hasUnread ? "Poppins_700Bold" : "Poppins_600SemiBold" }]}>{otherUser.name}</Text>
                  <Text style={[styles.chatLastMsg, { color: hasUnread ? tk.text : tk.textMuted, fontFamily: hasUnread ? "Inter_600SemiBold" : "Inter_400Regular" }]} numberOfLines={1}>
                    {c.lastMessage?.text || "Started a conversation"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={[styles.chatTime, { color: hasUnread ? colors.coral : tk.textMuted }]}>
                    {formatRelativeTime(c.lastMessage?.createdAt || c.updatedAt)}
                  </Text>
                  {hasUnread && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.coral }} />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* New Chat Modal */}
      <Modal visible={isNewChatOpen} animationType="slide" transparent onRequestClose={() => setIsNewChatOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsNewChatOpen(false)}>
          <View style={[styles.modalContent, { backgroundColor: tk.card }]} onStartShouldSetResponder={() => true}>
            <View style={[styles.sheetHandle, { backgroundColor: tk.textMuted }]} />
            <Text style={[styles.modalTitle, { color: tk.text }]}>New Chat</Text>

            <View style={[styles.searchBar, { backgroundColor: tk.bg, borderColor: tk.border }]}>
              <Search size={16} color={tk.textMuted} />
              <TextInput
                placeholder="Search people..."
                placeholderTextColor={tk.textMuted}
                value={searchQuery}
                onChangeText={handleSearch}
                style={[styles.searchInput, { color: tk.text }]}
                autoFocus
              />
            </View>

            {searchLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                  searchQuery.trim() ? <Text style={[styles.emptyText, { color: tk.textMuted }]}>No users found</Text> : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchRow}
                    onPress={() => handleStartNewChat(item.id)}
                  >
                    <Avatar source={item.avatar_url ? { uri: item.avatar_url } : require("../src/assets/doodle-puppy.png")} name={item.name} size={40} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[styles.searchName, { color: tk.text }]}>{item.name}</Text>
                      <Text style={[styles.searchHandle, { color: tk.textMuted }]}>@{item.username}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  startChatBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 },

  // List view
  chatRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  avatarWrap: { position: "relative" },
  chatName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  chatLastMsg: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  chatTime: { fontSize: 11, fontFamily: "Inter_400Regular" },

  // Detail view
  dateDivider: { alignItems: "center", marginVertical: 16 },
  dateDividerText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  msgRowOther: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowMe: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
  bubbleOther: { borderRadius: 20, borderBottomLeftRadius: 4, padding: 12, paddingHorizontal: 16, maxWidth: "75%", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  bubbleMe: { borderRadius: 20, borderBottomRightRadius: 4, padding: 12, paddingHorizontal: 16, maxWidth: "75%", backgroundColor: colors.primary },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  timeText: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4 },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  msgInput: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, minHeight: 44, maxHeight: 100, fontSize: 14, fontFamily: "Inter_400Regular" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { height: "70%", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20 },
  sheetHandle: { width: 48, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: 16, opacity: 0.2 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, marginBottom: 16 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  searchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  searchName: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  searchHandle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyText: { textAlign: "center", marginTop: 20, fontFamily: "Inter_400Regular" },
});
