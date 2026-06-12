import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Pressable, Alert, Keyboard, Image
} from "react-native";
import { tints } from "../src/lib/theme";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Avatar } from "../src/components/Avatar";
import { colors } from "../src/lib/theme";
import { Send, Plus, Search, MessageCircle, Check, CheckCheck, ChevronRight, Users, Heart } from "../src/components/ui/icons";
import { useAuthStore } from "../src/lib/auth-store";
import { chatApi } from "../services/chat/chatApi";
import { petApi } from "../services/pet/petApi";
import { userApi } from "../services/user/userApi";
import { circleApi } from "../services/community/circleApi";
import { questionApi } from "../services/community/questionApi";
import { socketService } from "../services/socket/socketService";
import { useNotificationStore } from "../src/lib/notification-store";
import { useRouter, useLocalSearchParams } from "expo-router";
import { feedApi } from "../services/community/feedApi";
import { Video, ResizeMode } from "expo-av";
import { useTokens } from "@/lib/theme-store";

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

// --- Shared Post Card for Chat Messages ---
function SharedPostCard({ postId, isMe, tk, router }: { postId: string; isMe: boolean; tk: any; router: any }) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPost = async () => {
      try {
        const data = await feedApi.getPostById(postId);
        if (active) {
          if (data) {
            setPost(data);
          } else {
            setIsDeleted(true);
          }
        }
      } catch (err) {
        console.error("Failed to load shared post details", err);
        if (active) {
          setIsDeleted(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchPost();
    return () => { active = false; };
  }, [postId]);

  if (loading) {
    return (
      <View style={[styles.sharedCardPlaceholder, { backgroundColor: tk.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (isDeleted) {
    return (
      <View style={[styles.sharedCardFallback, { backgroundColor: tk.bg, padding: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", borderStyle: "dashed", borderWidth: 1, borderColor: tk.border, width: "100%", minHeight: 80 }]}>
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: tk.textMuted, fontSize: 13, textAlign: "center" }}>This post got deleted</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/post/${postId}`)}
        style={[styles.sharedCardFallback, { backgroundColor: tk.border }]}
        activeOpacity={0.7}
      >
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: tk.text, fontSize: 13 }}>View Shared Post</Text>
      </TouchableOpacity>
    );
  }

  const author = post.author || {};
  const displayName = author.name || "parent";
  const avatarSource = author.avatarUrl || author.avatar_url ? { uri: author.avatarUrl || author.avatar_url } : null;

  const TINT: Record<string, string> = {
    dogs: "#FF6B6B22", cats: "#FF6FCF22", rescue: "#4CAF5022",
    health: "#2563EB18", training: "#FFD93D44", milestone: "#FF6FCF22",
    photo: "#FF6B6B22", reel: "#2563EB18", general: "#FFD93D22",
  };
  const tintColor = post.tintColor || TINT[(post.category || "").toLowerCase()] || "#FF6B6B22";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/post/${postId}`)}
      activeOpacity={0.9}
      style={[
        styles.sharedCardContainer,
        { 
          backgroundColor: tk.bg, 
          borderColor: tk.border 
        }
      ]}
    >
      {/* Header */}
      <View style={styles.sharedCardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          {avatarSource?.uri ? (
            <Image source={{ uri: avatarSource.uri }} style={{ width: 32, height: 32, borderRadius: 16 }} />
          ) : (
            <Avatar name={displayName} size={32} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.sharedCardPetName, { color: tk.text }]} numberOfLines={1}>
              {author.username || "parent"}
            </Text>
          </View>
        </View>

        {/* Type badges */}
        {post.type === "rescue" && <View style={[styles.sharedCardTypeBadge, { backgroundColor: colors.success }]}><Text style={styles.sharedCardTypeBadgeText}>RESCUE</Text></View>}
        {post.type === "milestone" && <View style={[styles.sharedCardTypeBadge, { backgroundColor: colors.pinky }]}><Text style={styles.sharedCardTypeBadgeText}>MILESTONE</Text></View>}
        {!post.type && post.category === "Adoption" && <View style={[styles.sharedCardTypeBadge, { backgroundColor: colors.success }]}><Text style={styles.sharedCardTypeBadgeText}>ADOPTION</Text></View>}
        {!post.type && post.category === "Lost & Found" && <View style={[styles.sharedCardTypeBadge, { backgroundColor: colors.coral }]}><Text style={styles.sharedCardTypeBadgeText}>LOST & FOUND</Text></View>}
        {!post.type && post.category === "Training" && <View style={[styles.sharedCardTypeBadge, { backgroundColor: colors.primary }]}><Text style={styles.sharedCardTypeBadgeText}>TRAINING</Text></View>}
        {!post.type && post.category === "Health" && <View style={[styles.sharedCardTypeBadge, { backgroundColor: "#2563EB" }]}><Text style={styles.sharedCardTypeBadgeText}>HEALTH</Text></View>}
      </View>

      {/* Image or Video */}
      {(post.image || post.imageUrl) ? (
        <View style={[styles.sharedCardImageWrapper, { backgroundColor: tintColor }]}>
          {post.image ? (
            <Image source={post.image} style={styles.sharedCardPostImage} resizeMode="contain" />
          ) : post.imageUrl ? (
            post.imageUrl.match(/\.(mp4|mov|quicktime|3gp|mpeg|avi|wmv|flv|mkv|webm)(\?|$)/i) ? (
              <Video
                source={{ uri: post.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                isMuted={true}
                shouldPlay={true}
                isLooping
              />
            ) : (
              <Image source={{ uri: post.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            )
          ) : null}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: tk.text }} numberOfLines={3}>
            {post.content}
          </Text>
        </View>
      )}



      {/* Tags */}
      {post.tags && post.tags.length > 0 ? (
        <Text style={styles.sharedCardTags} numberOfLines={1}>{post.tags.map((t: string) => `#${t}`).join("  ")}</Text>
      ) : post.category ? (
        <Text style={styles.sharedCardTags} numberOfLines={1}>#{post.category}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// --- Shared Profile Card for Chat Messages ---
function SharedProfileCard({ username, isMe, tk, router }: { username: string; isMe: boolean; tk: any; router: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const data = await userApi.getUserProfile(username);
        if (active) {
          if (data) {
            setProfile(data);
          } else {
            setIsDeleted(true);
          }
        }
      } catch (err) {
        console.error("Failed to load shared profile details", err);
        if (active) {
          setIsDeleted(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchProfile();
    return () => { active = false; };
  }, [username]);

  if (isDeleted) {
    return (
      <View style={[styles.sharedCardFallback, { backgroundColor: tk.bg, padding: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", borderStyle: "dashed", borderWidth: 1, borderColor: tk.border, width: "100%", minHeight: 80 }]}>
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: tk.textMuted, fontSize: 13, textAlign: "center" }}>This profile got deleted</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.sharedCardPlaceholder, { backgroundColor: tk.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/u/${username}`)}
        style={[styles.sharedCardFallback, { backgroundColor: tk.border }]}
        activeOpacity={0.7}
      >
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: tk.text, fontSize: 13 }}>View Shared Profile</Text>
      </TouchableOpacity>
    );
  }

  const displayName = profile.name || "parent";
  const avatarSource = profile.avatar_url || profile.avatarUrl ? { uri: profile.avatar_url || profile.avatarUrl } : null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/u/${username}`)}
      activeOpacity={0.9}
      style={[
        styles.sharedProfileCardContainer,
        { 
          backgroundColor: tk.bg, 
        }
      ]}
    >
      <View style={styles.sharedProfileCardContent}>
        {avatarSource?.uri ? (
          <Image source={{ uri: avatarSource.uri }} style={styles.sharedProfileAvatar} />
        ) : (
          <Avatar name={displayName} size={50} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.sharedProfileName, { color: tk.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.sharedProfileUsername, { color: tk.textMuted }]} numberOfLines={1}>
            {profile.username || username}
          </Text>
        </View>
      </View>
      
      <View style={[styles.sharedProfileDivider, { backgroundColor: tk.border }]} />
      
      <View style={styles.sharedProfileFooter}>
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: colors.primary, fontSize: 12 }}>View Profile</Text>
        <ChevronRight size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

// --- Shared Circle Card for Chat Messages ---
function SharedCircleCard({ circleId, isMe, tk, router }: { circleId: string; isMe: boolean; tk: any; router: any }) {
  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchCircle = async () => {
      try {
        const data = await circleApi.getCircleById(circleId);
        if (active) {
          if (data) {
            setCircle(data);
          } else {
            setIsDeleted(true);
          }
        }
      } catch (err) {
        console.error("Failed to load shared circle details", err);
        if (active) {
          setIsDeleted(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchCircle();
    return () => { active = false; };
  }, [circleId]);

  if (isDeleted) {
    return (
      <View style={[styles.sharedCardFallback, { backgroundColor: tk.bg, padding: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", borderStyle: "dashed", borderWidth: 1, borderColor: tk.border, width: "100%", minHeight: 80 }]}>
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: tk.textMuted, fontSize: 13, textAlign: "center" }}>This circle got deleted</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.sharedCardPlaceholder, { backgroundColor: tk.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!circle) {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/community/${circleId}`)}
        style={[styles.sharedCardFallback, { backgroundColor: tk.border }]}
        activeOpacity={0.7}
      >
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: tk.text, fontSize: 13 }}>View Shared Circle</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/community/${circleId}`)}
      activeOpacity={0.9}
      style={[
        styles.sharedCircleCardContainer,
        { 
          backgroundColor: tk.bg, 
        }
      ]}
    >
      <View style={styles.sharedCircleCardContent}>
        {circle.coverImage ? (
          <Image source={{ uri: circle.coverImage }} style={styles.sharedCircleAvatar} />
        ) : (
          <View style={[styles.sharedCircleAvatar, { backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }]}>
            <Users size={24} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.sharedCircleName, { color: tk.text }]} numberOfLines={1}>
            {circle.name}
          </Text>
          <Text style={[styles.sharedCircleMembers, { color: tk.textMuted }]} numberOfLines={1}>
            {circle.memberCount || 0} members · {circle.category || "General"}
          </Text>
        </View>
      </View>
      
      <View style={[styles.sharedCircleDivider, { backgroundColor: tk.border }]} />
      
      <View style={styles.sharedCircleFooter}>
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: colors.primary, fontSize: 12 }}>View Circle</Text>
        <ChevronRight size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

// --- Shared Thread Card for Chat Messages ---
function SharedThreadCard({ threadId, isMe, tk, router }: { threadId: string; isMe: boolean; tk: any; router: any }) {
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchThread = async () => {
      try {
        const data = await questionApi.getQuestionById(threadId);
        if (active) {
          if (data) {
            setThread(data);
          } else {
            setIsDeleted(true);
          }
        }
      } catch (err) {
        console.error("Failed to load shared thread details", err);
        if (active) {
          setIsDeleted(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchThread();
    return () => { active = false; };
  }, [threadId]);

  if (isDeleted) {
    return (
      <View style={[styles.sharedCardFallback, { backgroundColor: tk.bg, padding: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", borderStyle: "dashed", borderWidth: 1, borderColor: tk.border, width: "100%", minHeight: 80 }]}>
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: tk.textMuted, fontSize: 13, textAlign: "center" }}>This discussion got deleted</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.sharedCardPlaceholder, { backgroundColor: tk.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!thread) {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/thread/${threadId}`)}
        style={[styles.sharedCardFallback, { backgroundColor: tk.border }]}
        activeOpacity={0.7}
      >
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: tk.text, fontSize: 13 }}>View Shared Discussion</Text>
      </TouchableOpacity>
    );
  }

  const askerName = thread.author?.name || "Someone";
  const formattedTime = thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : "";

  const handlePress = () => {
    router.push({
      pathname: `/thread/${threadId}`,
      params: {
        id: thread.id,
        title: thread.title,
        body: thread.body || "",
        tags: thread.tags?.[0] || "",
        askerName: askerName,
        time: formattedTime,
        upvotes: thread.upvotes || 0,
        questionUserId: thread.userId || thread.author?.id || "",
      }
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={[
        styles.sharedThreadCardContainer,
        { 
          backgroundColor: tk.bg, 
        }
      ]}
    >
      <View style={styles.sharedThreadCardContent}>
        <Text style={[styles.sharedThreadTitle, { color: tk.text }]} numberOfLines={2}>
          {thread.title}
        </Text>
        <Text style={[styles.sharedThreadAsker, { color: tk.textMuted }]} numberOfLines={1}>
          Asked by <Text style={{ fontFamily: "Poppins_700Bold", color: tk.text }}>{askerName}</Text>
        </Text>
      </View>
      
      <View style={[styles.sharedThreadDivider, { backgroundColor: tk.border }]} />
      
      <View style={styles.sharedThreadFooter}>
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: colors.primary, fontSize: 12 }}>View Discussion</Text>
        <ChevronRight size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

// --- Shared Pet Card for Chat Messages ---
function SharedPetCard({ petId, isMe, tk, router }: { petId: string; isMe: boolean; tk: any; router: any }) {
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPet = async () => {
      try {
        const data = await petApi.getPetById(petId);
        if (active) {
          if (data) {
            setPet(data);
          } else {
            setIsDeleted(true);
          }
        }
      } catch (err) {
        console.error("Failed to load shared pet details", err);
        if (active) {
          setIsDeleted(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchPet();
    return () => { active = false; };
  }, [petId]);

  if (loading) {
    return (
      <View style={[styles.sharedCardPlaceholder, { backgroundColor: tk.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (isDeleted) {
    return (
      <View style={[styles.sharedCardFallback, { backgroundColor: tk.bg, padding: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", borderStyle: "dashed", borderWidth: 1, borderColor: tk.border, width: "100%", minHeight: 80 }]}>
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: tk.textMuted, fontSize: 13, textAlign: "center" }}>This pet got deleted</Text>
      </View>
    );
  }

  const petImage = pet.avatarUrl || pet.avatar_url;
  const breedAge = [pet.breed, pet.age].filter(Boolean).join(" · ") || pet.species || "Pet";

  return (
    <View
      style={[
        styles.sharedCircleCardContainer,
        { 
          backgroundColor: tk.bg, 
        }
      ]}
    >
      {/* Pet Image on top */}
      <View style={styles.sharedCardImageWrapper}>
        <TouchableOpacity
          onPress={() => router.push(`/p/${petId}`)}
          activeOpacity={0.9}
          style={{ width: "100%", height: "100%" }}
        >
          {petImage ? (
            <Image source={{ uri: petImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={[styles.sharedCardPlaceholder, { backgroundColor: tk.border, width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }]}>
              <Heart size={40} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Pet details at the bottom */}
      <View style={{ padding: 12, gap: 4 }}>
        <Text style={[styles.sharedCircleName, { color: tk.text }]} numberOfLines={1}>
          {pet.name}
        </Text>
        <Text style={[styles.sharedCircleMembers, { color: tk.textMuted }]} numberOfLines={1}>
          {breedAge}
        </Text>
      </View>
      
      <View style={[styles.sharedCircleDivider, { backgroundColor: tk.border }]} />
      
      <TouchableOpacity
        onPress={() => router.push(`/p/${petId}`)}
        activeOpacity={0.7}
        style={styles.sharedCircleFooter}
      >
        <Text style={{ fontFamily: "Poppins_600SemiBold", color: colors.primary, fontSize: 12 }}>View Pet Profile</Text>
        <ChevronRight size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

// --- Main Component ---
export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [selectedChat, setSelectedChat] = useState<string | null>(params.id || null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const tk = useTokens();
  const { user } = useAuthStore();
  const clearChatUnread = useNotificationStore((s) => s.clearChatUnread);

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // --- List View Methods ---
  const loadConversations = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
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
      loadConversations(conversations.length === 0);
    }
  }, [selectedChat]);

  // Handle global socket events for list view
  useEffect(() => {
    const unsub = socketService.on("chat:message", (data: any) => {
      if (data.conversationId && data.message) {
        setConversations((prevConvs) => {
          const index = prevConvs.findIndex((c) => c.id === data.conversationId);
          if (index === -1) {
            // New conversation, fetch latest list silently
            loadConversations(false);
            return prevConvs;
          }

          const updatedConversations = [...prevConvs];
          const conversationToUpdate = { 
            ...updatedConversations[index],
            lastMessage: data.message,
            updatedAt: data.message.createdAt,
          };

          // Increment unread count if we are not currently viewing this chat
          if (selectedChat !== data.conversationId) {
            conversationToUpdate.unreadCount = (conversationToUpdate.unreadCount || 0) + 1;
          }

          // Move the updated conversation to the top
          updatedConversations.splice(index, 1);
          updatedConversations.unshift(conversationToUpdate);

          return updatedConversations;
        });
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
      const results = await userApi.searchFollowers(text || "");
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
    // Don't close the modal yet — wait until we know the API succeeded
    try {
      const conv = await chatApi.startChat(recipientId);
      // Only close modal and navigate on success
      setIsNewChatOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedChat(conv.id);
    } catch (e: any) {
      const msg = e?.message || "Failed to start chat";
      Alert.alert("Can't send message", msg);
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

      // Update local conversations state to reset unread count of the selected chat
      setConversations((prevConvs) =>
        prevConvs.map((c) =>
          c.id === selectedChat ? { ...c, unreadCount: 0 } : c
        )
      );
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
        // Tell backend we read it, since we're currently looking at it
        chatApi.markChatAsRead(selectedChat).catch(() => { });
      }
    });

    const unsubRead = socketService.on("chat:read", (data: any) => {
      if (data.conversationId === selectedChat) {
        setMessages((prev) => prev.map(m => 
          m.sender?.id === user?.id ? { ...m, isRead: true } : m
        ));
      }
    });

    return () => { unsub(); unsubRead(); };
  }, [selectedChat, user?.id]);

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
      let prefixText = text.replace(match[0], "").trim();
      if (prefixText === "Check out this post!") {
        prefixText = "";
      }

      return (
        <View>
          {prefixText ? <Text style={[styles.bubbleText, { color: tk.text, paddingHorizontal: 12, paddingTop: 10, marginBottom: 8 }]}>{prefixText}</Text> : null}
          <SharedPostCard postId={postId} isMe={isMe} tk={tk} router={router} />
        </View>
      );
    }

    const profileMatch = text.match(/furrcircle:\/\/profile\/([A-Za-z0-9_-]+)/);
    if (profileMatch) {
      const username = profileMatch[1];
      let prefixText = text.replace(profileMatch[0], "").trim();
      if (prefixText === "Check out this profile!") {
        prefixText = "";
      }

      return (
        <View>
          {prefixText ? <Text style={[styles.bubbleText, { color: tk.text, paddingHorizontal: 12, paddingTop: 10, marginBottom: 8 }]}>{prefixText}</Text> : null}
          <SharedProfileCard username={username} isMe={isMe} tk={tk} router={router} />
        </View>
      );
    }

    const circleMatch = text.match(/furrcircle:\/\/circle\/([A-Za-z0-9_-]+)/);
    if (circleMatch) {
      const circleId = circleMatch[1];
      let prefixText = text.replace(circleMatch[0], "").trim();
      if (prefixText === "Check out this circle!") {
        prefixText = "";
      }

      return (
        <View>
          {prefixText ? <Text style={[styles.bubbleText, { color: tk.text, paddingHorizontal: 12, paddingTop: 10, marginBottom: 8 }]}>{prefixText}</Text> : null}
          <SharedCircleCard circleId={circleId} isMe={isMe} tk={tk} router={router} />
        </View>
      );
    }

    const threadMatch = text.match(/furrcircle:\/\/thread\/([A-Za-z0-9_-]+)/);
    if (threadMatch) {
      const threadId = threadMatch[1];
      let prefixText = text.replace(threadMatch[0], "").trim();
      if (prefixText === "Check out this discussion!") {
        prefixText = "";
      }

      return (
        <View>
          {prefixText ? <Text style={[styles.bubbleText, { color: tk.text, paddingHorizontal: 12, paddingTop: 10, marginBottom: 8 }]}>{prefixText}</Text> : null}
          <SharedThreadCard threadId={threadId} isMe={isMe} tk={tk} router={router} />
        </View>
      );
    }

    const petMatch = text.match(/furrcircle:\/\/pet\/([A-Za-z0-9-]+)/);
    if (petMatch) {
      const petId = petMatch[1];
      const prefixText = text.replace(petMatch[0], "").trim();

      return (
        <View>
          <SharedPetCard petId={petId} isMe={isMe} tk={tk} router={router} />
          {prefixText ? (
            <Text style={[styles.bubbleText, { color: tk.text, marginTop: 10, marginBottom: 12, paddingHorizontal: 12 }]}>
              {prefixText}
            </Text>
          ) : null}
        </View>
      );
    }

    return <Text style={[styles.bubbleText, { color: isMe ? "#fff" : tk.text }]}>{text}</Text>;
  };

  // Group messages by date for dividers (must be at top level to follow Rules of Hooks)
  const groupedMessages = useMemo(() => {
    if (!selectedChat) return [];

    // Sort messages chronologically (oldest to newest) to prevent out-of-order rendering
    const sortedMessages = [...messages].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Group messages by start of the day
    const dayGroups: { dayTimestamp: number; dateText: string; messages: any[] }[] = [];

    sortedMessages.forEach(m => {
      const msgDate = new Date(m.createdAt);
      const startOfDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate()).getTime();

      let group = dayGroups.find(g => g.dayTimestamp === startOfDay);
      if (!group) {
        group = {
          dayTimestamp: startOfDay,
          dateText: getDateGroup(m.createdAt),
          messages: []
        };
        dayGroups.push(group);
      }
      group.messages.push(m);
    });

    // Sort the day groups chronologically (oldest day first)
    dayGroups.sort((a, b) => a.dayTimestamp - b.dayTimestamp);

    // Flatten into renderable array with dividers
    const result: any[] = [];
    dayGroups.forEach(group => {
      result.push({ type: 'divider', text: group.dateText, id: `div-${group.dayTimestamp}` });
      result.push(...group.messages.map(m => ({ ...m, type: 'message' })));
    });

    return result.reverse(); // FlatList inverted expects newest first
  }, [messages, selectedChat]);

  const displayConversations = useMemo(() => {
    const q = listSearchQuery.toLowerCase().trim();
    return conversations
      .filter((c) => c.lastMessage)
      .filter((c) => {
        if (!q) return true;
        const other = getOtherParticipant(c);
        const name = (other?.name || "").toLowerCase();
        const username = (other?.username || "").toLowerCase();
        return name.includes(q) || username.includes(q);
      })
      .sort((a, b) => {
        const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [conversations, listSearchQuery]);

  // --- Render Detail View ---
  if (selectedChat) {
    const otherUser = getOtherParticipant(chatDetail) || { name: "Loading...", avatar_url: null };

    return (
      <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
      enabled={true}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
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
              const isPostShare = item.text && item.text.includes("furrcircle://post/");
              const isProfileShare = item.text && item.text.includes("furrcircle://profile/");
              const isCircleShare = item.text && item.text.includes("furrcircle://circle/");
              const isThreadShare = item.text && item.text.includes("furrcircle://thread/");
              const isPetShare = item.text && item.text.includes("furrcircle://pet/");
              const isCardShare = isPostShare || isProfileShare || isCircleShare || isThreadShare || isPetShare;
              return (
                <View style={isMe ? styles.msgRowMe : styles.msgRowOther}>
                  {!isMe && (
                    <TouchableOpacity onPress={() => otherUser.username && router.push(`/u/${otherUser.username}`)}>
                      <Avatar source={otherUser.avatar_url ? { uri: otherUser.avatar_url } : require("../src/assets/doodle-puppy.png")} name={otherUser.name} size={28} />
                    </TouchableOpacity>
                  )}
                  <View style={
                    isCardShare
                      ? [
                          isMe ? styles.sharedBubbleMe : styles.sharedBubbleOther,
                          { backgroundColor: tk.bg, borderColor: tk.border, borderWidth: 1, width: 230 }
                        ]
                      : [
                          isMe ? styles.bubbleMe : styles.bubbleOther,
                          !isMe && { backgroundColor: tk.card }
                        ]
                  }>
                    {renderMessageContent(item.text, isMe, tk, router)}
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      alignSelf: isMe ? "flex-end" : "flex-start", 
                      gap: 4,
                      paddingHorizontal: isCardShare ? 12 : 0,
                      paddingBottom: isCardShare ? 8 : 0,
                      marginTop: isCardShare ? 6 : 0
                    }}>
                      <Text style={[styles.timeText, { color: (isMe && !isCardShare) ? "rgba(255,255,255,0.7)" : tk.textMuted }]}>
                        {formatTime(item.createdAt)}
                      </Text>
                      {isMe && (
                        (item.isRead || item.readAt || item.seen) ? (
                          <CheckCheck size={14} color="#60a5fa" />
                        ) : (
                          <Check size={14} color={(isMe && !isCardShare) ? "rgba(255,255,255,0.7)" : tk.textMuted} />
                        )
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
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
      </KeyboardAvoidingView>
    );
  }

  const AVATAR_TINTS = [tints.sunshine, tints.primary, tints.pinky, tints.coral, tints.success];

  // --- Render List View ---
  return (
    <View style={[styles.container, { backgroundColor: tk.bg }]}>
      <ScreenHeader
        title="Messages"
        // right={
        //   <TouchableOpacity
        //     style={[styles.headerIconBtn, { backgroundColor: tk.card }]}
        //     onPress={() => setIsNewChatOpen(true)}
        //   >
        //     <Plus size={22} color={tk.text} />
        //   </TouchableOpacity>
        // }
      />

      {/* Search pill */}
      <View style={[styles.searchPill, { backgroundColor: tk.card }]}>
        <Search size={18} color={tk.textMuted} />
        <TextInput
          value={listSearchQuery}
          onChangeText={setListSearchQuery}
          placeholder="Search chats"
          placeholderTextColor={tk.textMuted}
          style={[styles.searchPillInput, { color: tk.text }]}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : displayConversations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: tk.card, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <MessageCircle size={40} color={tk.textMuted} />
          </View>
          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 18, color: tk.text, textAlign: "center" }}>
            {listSearchQuery ? "No results found" : "No messages yet"}
          </Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: tk.textMuted, textAlign: "center", marginTop: 8 }}>
            {listSearchQuery ? "Try a different name" : "Start a conversation with a friend or a vet!"}
          </Text>
          {!listSearchQuery && (
            <TouchableOpacity
              style={[styles.startChatBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsNewChatOpen(true)}
            >
              <Text style={{ fontFamily: "Poppins_600SemiBold", color: "#fff" }}>New Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item: c, index }) => {
            const otherUser = getOtherParticipant(c);
            if (!otherUser) return null;

            const hasUnread = c.unreadCount > 0 || (c.lastMessage && !c.lastMessage.readAt && !c.lastMessage.seen && c.lastMessage.sender?.id !== user?.id);
            const unreadCount = c.unreadCount || 0;
            const tintBg = AVATAR_TINTS[index % AVATAR_TINTS.length];

            return (
              <TouchableOpacity
                onPress={() => setSelectedChat(c.id)}
                style={[styles.chatCard, { backgroundColor: tk.card }]}
                activeOpacity={0.8}
              >
                <View style={[styles.avatarTintWrap, { backgroundColor: tintBg }]}>
                  <Avatar source={otherUser.avatar_url ? { uri: otherUser.avatar_url } : require("../src/assets/doodle-puppy.png")} name={otherUser.name} size={52} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chatName, { color: tk.text, fontFamily: hasUnread ? "Poppins_700Bold" : "Poppins_600SemiBold" }]}>{otherUser.name}</Text>
                  <Text style={[styles.chatLastMsg, { color: hasUnread ? tk.text : tk.textMuted, fontFamily: hasUnread ? "Inter_600SemiBold" : "Inter_400Regular" }]} numberOfLines={1}>
                    {c.lastMessage?.text || "Started a conversation"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={[styles.chatTime, { color: hasUnread ? colors.coral : tk.textMuted }]}>
                    {formatRelativeTime(c.lastMessage?.createdAt || c.updatedAt)}
                  </Text>
                  {hasUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : "•"}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsNewChatOpen(true)}
        activeOpacity={0.85}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* New Chat Modal */}
      <Modal visible={isNewChatOpen} animationType="slide" transparent onRequestClose={() => setIsNewChatOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : (keyboardVisible ? "height" : undefined)}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); setIsNewChatOpen(false); }}>
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
                    <Text style={[styles.emptyText, { color: tk.textMuted }]}>
                      {searchQuery.trim() ? "No users found" : "No followers yet"}
                    </Text>
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
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  startChatBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 },

  // Search pill
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  searchPillInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 0 },

  // List view — card rows
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
  },
  avatarTintWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Poppins_700Bold" },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  chatName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  chatLastMsg: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  chatTime: { fontSize: 11, fontFamily: "Inter_400Regular" },

  // Detail view
  dateDivider: { alignItems: "center", marginVertical: 16 },
  dateDividerText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  msgRowOther: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowMe: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
  bubbleOther: { borderRadius: 20, borderBottomLeftRadius: 4, padding: 12, paddingHorizontal: 16, maxWidth: "75%" },
  bubbleMe: { borderRadius: 20, borderBottomRightRadius: 4, padding: 12, paddingHorizontal: 16, maxWidth: "75%", backgroundColor: colors.primary },
  sharedBubbleMe: { borderRadius: 20, borderBottomRightRadius: 4, padding: 0, maxWidth: "75%", overflow: "hidden" },
  sharedBubbleOther: { borderRadius: 20, borderBottomLeftRadius: 4, padding: 0, maxWidth: "75%", overflow: "hidden" },
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
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 0 },
  searchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  searchName: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  searchHandle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyText: { textAlign: "center", marginTop: 20, fontFamily: "Inter_400Regular" },

  // Shared Post Card styles
  sharedCardPlaceholder: { width: 220, height: 120, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  sharedCardFallback: { padding: 12, borderRadius: 12, alignItems: "center", minWidth: 150 },
  sharedCardContainer: { width: "100%", overflow: "hidden", borderTopLeftRadius: 19, borderTopRightRadius: 19 },
  sharedCardHeader: { flexDirection: "row", alignItems: "center", padding: 8, gap: 8 },
  sharedCardPetName: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  sharedCardTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  sharedCardTypeBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 8, color: "#fff" },
  sharedCardImageWrapper: { width: "100%", height: 140, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  sharedCardPostImage: { width: "100%", height: "100%" },
  sharedCardCaption: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, paddingHorizontal: 8, paddingTop: 6 },
  sharedCardCaptionBold: { fontFamily: "Poppins_700Bold" },
  sharedCardTags: { fontSize: 10, color: colors.primary, fontFamily: "Poppins_600SemiBold", paddingHorizontal: 8, paddingBottom: 8, marginTop: 4 },

  // Shared Profile Card styles
  sharedProfileCardContainer: { width: "100%", overflow: "hidden", borderTopLeftRadius: 19, borderTopRightRadius: 19 },
  sharedProfileCardContent: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  sharedProfileAvatar: { width: 50, height: 50, borderRadius: 25 },
  sharedProfileName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  sharedProfileUsername: { fontFamily: "Inter_400Regular", fontSize: 12 },
  sharedProfileDivider: { height: 1 },
  sharedProfileFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12 },

  // Shared Circle Card styles
  sharedCircleCardContainer: { width: "100%", overflow: "hidden", borderTopLeftRadius: 19, borderTopRightRadius: 19 },
  sharedCircleCardContent: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  sharedCircleAvatar: { width: 50, height: 50, borderRadius: 25, overflow: "hidden" },
  sharedCircleName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  sharedCircleMembers: { fontFamily: "Inter_400Regular", fontSize: 12 },
  sharedCircleDivider: { height: 1 },
  sharedCircleFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12 },

  // Shared Thread Card styles
  sharedThreadCardContainer: { width: "100%", overflow: "hidden", borderTopLeftRadius: 19, borderTopRightRadius: 19 },
  sharedThreadCardContent: { padding: 12, gap: 6 },
  sharedThreadTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, lineHeight: 20 },
  sharedThreadAsker: { fontFamily: "Inter_400Regular", fontSize: 12 },
  sharedThreadDivider: { height: 1 },
  sharedThreadFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 12 },
});
