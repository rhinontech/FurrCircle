import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, Dimensions, FlatList, ActivityIndicator, RefreshControl, Modal, Alert, Share, KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { Syringe, Stethoscope, Calendar, Heart, PawPrint, MapPin, Star, MessageCircle, Share2, Bookmark, X } from "lucide-react-native";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useFocusEffect } from "expo-router";
import { userHomeApi } from "@/services/users/homeApi";
import { userCommunityApi } from "@/services/users/communityApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [pets, setPets] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [vets, setVets] = useState<any[]>([]);
  const [latestPost, setLatestPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [petPickerTarget, setPetPickerTarget] = useState<string | null>(null);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const reminderBgDark: Record<string, string> = {
    warning: "#2d1e00",
    info: "#0c1a3a",
    danger: "#2d0011",
    success: "#002b12",
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'vaccine': return Syringe;
      case 'appointment': return Calendar;
      case 'medication': return Syringe; // or a pill icon if available
      default: return Syringe;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const data = await userHomeApi.getHomeData();
      setPets(data.pets);
      setReminders(data.reminders);
      setVets(data.vets);
      setLatestPost(data.latestPost);
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleLike = async (postId: string) => {
    try {
      const res = await userCommunityApi.togglePostLike(postId);
      if (latestPost && latestPost.id === postId) {
        const likes = res.liked
          ? [...(latestPost.likes || []), { userId: user?.id }]
          : (latestPost.likes || []).filter((like: any) => like.userId !== user?.id);
        setLatestPost({ ...latestPost, likes });
      }
    } catch (error) {
      console.error("Error toggling like", error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const res = await userCommunityApi.togglePostSave(postId);
      if (latestPost && latestPost.id === postId) {
        const savedBy = res.saved
          ? [...(latestPost.savedBy || []), user?.id]
          : (latestPost.savedBy || []).filter((savedUserId: string) => savedUserId !== user?.id);
        setLatestPost({ ...latestPost, savedBy });
      }
    } catch (error) {
      console.error("Error saving post", error);
    }
  };

  const handleShare = async (post: any) => {
    try {
      const res = await userCommunityApi.sharePost(post.id);
      await Share.share({
        message: `${post.author?.name || "FurrCircle member"} posted in ${post.category}: ${post.content}`
      });
      if (latestPost && latestPost.id === post.id) {
        setLatestPost({ ...latestPost, shareCount: res.shareCount });
      }
    } catch (error) {
      console.error("Error sharing post", error);
    }
  };

  const handleAddComment = async () => {
    if (!latestPost || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await userCommunityApi.addPostComment(latestPost.id, commentText.trim());
      setLatestPost({
        ...latestPost,
        comments: [...(latestPost.comments || []), res.comment]
      });
      setCommentText("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const navigateWithPet = (routePrefix: string) => {
    if (pets.length === 0) {
      Alert.alert("No Pets", "Add a pet first to start logging health data.");
      return;
    }

    if (pets.length === 1) {
      router.push(`${routePrefix}?petId=${pets[0].id}` as any);
      return;
    }

    setPetPickerTarget(routePrefix);
  };

  const renderPetCard = ({ item }: { item: any }) => (
    <View style={{ width: SCREEN_WIDTH - 40, marginRight: 20 }}>
      <Pressable
        onPress={() => router.push(`/pets/${item.id}`)}
        style={{ backgroundColor: colors.heroBg, borderRadius: 28, padding: 20, overflow: 'hidden' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={{ width: 64, height: 64, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: 64, height: 64, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
               <PawPrint size={28} color="#fff" />
            </View>
          )}
          
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{item.name}</Text>
            <Text style={{ fontSize: 14, color: colors.heroSub, marginTop: 2 }}>{item.breed} - {item.age || 'Age Unknown'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 24, marginTop: 16 }}>
          <View>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Weight</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{item.weight || '--'}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Health Score</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{item.healthScore || '90'}/100</Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Next Visit</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{item.nextVisit || '--'}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {/* Greeting */}
        <View style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 10 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>{(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning 👋' : h < 18 ? 'Good afternoon 👋' : 'Good evening 👋'; })()}</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>Hello, {user?.name?.split(' ')[0] || 'Guest'}</Text>
        </View>

        {/* Pet Cards Slider */}
        <View style={{ marginTop: 20, marginBottom: 20 }}>
          {pets.length === 0 ? (
            <View style={{ padding: 20, marginHorizontal: 20, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
               <PawPrint size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
               <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>Welcome to FurrCircle!</Text>
               <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 12 }}>Add your first pet to get started.</Text>
               <Pressable onPress={() => router.push("/pets/add")} style={{ backgroundColor: colors.brand, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                 <Text style={{ color: '#fff', fontWeight: '600' }}>Add Pet</Text>
               </Pressable>
            </View>
          ) : (
            <FlatList
              data={pets}
              renderItem={renderPetCard}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={SCREEN_WIDTH - 20}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20 }}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </View>

        {/* Reminders section */}
        {reminders.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>Upcoming Reminders</Text>
              <Pressable onPress={() => router.push("/reminders")}>
                <Text style={{ fontSize: 14, color: colors.brand, fontWeight: '500' }}>See all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {reminders.filter(r => !r.isDone).slice(0, 5).map((r) => {
                const isOverdue = r.date && new Date(r.date) < new Date();
                const variant = isOverdue ? 'danger' : 'info';
                const bg = isDark ? reminderBgDark[variant] : (isOverdue ? '#fff1f2' : '#eff6ff');
                const Icon = getReminderIcon(r.type);
                const color = isOverdue ? '#e11d48' : '#0ea5e9';

                return (
                  <Pressable
                    key={r.id.toString()}
                    onPress={() => router.push("/reminders")}
                    style={{ minWidth: 160, backgroundColor: bg, borderRadius: 16, borderWidth: 1, borderColor: isDark ? colors.border : `${color}33`, padding: 14, marginRight: 12 }}
                  >
                    <Icon size={18} color={color} style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>{r.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
                      {r.pet?.name ? `${r.pet.name} - ` : ''}{r.date ? new Date(r.date).toLocaleDateString() : 'No date'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions grid */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => navigateWithPet("/health/add-vaccine")}
              style={{ flex: 1, backgroundColor: colors.successBg, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 }}
            >
              <Syringe size={22} color="#10b981" />
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#10b981', textAlign: 'center' }}>Log Vaccine</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(tabs)/discover")}
              style={{ flex: 1, backgroundColor: colors.infoBg, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 }}
            >
              <Stethoscope size={22} color="#0ea5e9" />
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#0ea5e9', textAlign: 'center' }}>Find Vet</Text>
            </Pressable>
            <Pressable
              onPress={() => navigateWithPet("/health/add-vital")}
              style={{ flex: 1, backgroundColor: isDark ? '#2d0a20' : '#fdf2f8', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 }}
            >
              <Heart size={22} color="#ec4899" />
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#ec4899', textAlign: 'center' }}>Log Vital</Text>
            </Pressable>
          </View>
        </View>

        {/* Nearby Vets */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>Nearby Vets</Text>
            <Pressable onPress={() => router.push("/(tabs)/discover")}>
              <Text style={{ fontSize: 14, color: colors.brand, fontWeight: '500' }}>View all</Text>
            </Pressable>
          </View>
          {vets.slice(0, 2).map((vet, index) => (
            <Pressable
              key={vet.id ?? index}
              onPress={() => router.push(`/vets/${vet.id}` as any)}
              style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.infoBg, alignItems: 'center', justifyContent: 'center', marginRight: 14, overflow: 'hidden' }}>
                  {vet.avatar_url ? (
                    <Image source={{ uri: vet.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Stethoscope size={24} color="#0ea5e9" />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                    {vet.clinic_name || vet.name || "Vet Clinic"}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                    <MapPin size={13} color={colors.textMuted} />
                    <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 4, marginRight: 12 }} numberOfLines={1}>
                      {vet.distance || vet.city || "Nearby"}
                    </Text>
                    <Star size={13} color="#f59e0b" fill="#f59e0b" />
                    <Text style={{ fontSize: 13, color: "#f59e0b", fontWeight: '700', marginLeft: 4 }}>
                      {Number(vet.rating || 4.8).toFixed(1)}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#e0f2fe', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#bae6fd' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#0369a1' }}>VET</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Community Spotlight */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Community Spotlight</Text>
          {latestPost ? (
            <Pressable
              onPress={() => router.push(`/community/posts/${latestPost.id}` as any)}
              style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                {latestPost.author?.avatar_url ? (
                  <Image source={{ uri: latestPost.author.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                    <PawPrint size={20} color={colors.brand} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>{latestPost.author?.name || "User"}</Text>
                    <StatusChip label={latestPost.author?.role?.toUpperCase() || "MEMBER"} variant="info" />
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{timeAgo(latestPost.createdAt)} · {latestPost.category}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20, marginBottom: 12 }} numberOfLines={4}>
                {latestPost.content}
              </Text>

              {latestPost.imageUrl && <Image source={{ uri: latestPost.imageUrl }} style={{ width: "100%", height: 176, borderRadius: 12, marginBottom: 12 }} resizeMode="cover" />}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 18, paddingTop: 4 }}>
                <Pressable onPress={(e) => { e.stopPropagation(); handleLike(latestPost.id); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {(() => {
                    const isLiked = (latestPost.likes || []).some((l: any) => l.userId === user?.id);
                    return (
                      <>
                        <Heart size={18} color={isLiked ? "#f43f5e" : colors.textMuted} fill={isLiked ? "#f43f5e" : "transparent"} />
                        <Text style={{ fontSize: 12, fontWeight: "500", color: isLiked ? "#f43f5e" : colors.textMuted }}>{latestPost.likes?.length || 0}</Text>
                      </>
                    );
                  })()}
                </Pressable>
                <Pressable onPress={(e) => { e.stopPropagation(); setIsCommentModalVisible(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <MessageCircle size={18} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted }}>{latestPost.comments?.length || 0}</Text>
                </Pressable>
                <Pressable onPress={(e) => { e.stopPropagation(); handleShare(latestPost); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Share2 size={18} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted }}>{latestPost.shareCount || 0}</Text>
                </Pressable>
                <Pressable onPress={(e) => { e.stopPropagation(); handleSave(latestPost.id); }} style={{ marginLeft: "auto" }}>
                  {(() => {
                    const isSaved = (latestPost.savedBy || []).includes(String(user?.id || ""));
                    return <Bookmark size={18} color={isSaved ? colors.brand : colors.textMuted} fill={isSaved ? colors.brand : "transparent"} />;
                  })()}
                </Pressable>
              </View>
            </Pressable>
          ) : (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>No community posts yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={!!petPickerTarget} animationType="slide" transparent onRequestClose={() => setPetPickerTarget(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>Choose a Pet</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 18 }}>Select which pet you want to log health data for.</Text>
            <View style={{ gap: 10 }}>
              {pets.map((pet) => (
                <Pressable
                  key={pet.id}
                  onPress={() => {
                    const target = petPickerTarget;
                    setPetPickerTarget(null);
                    if (target) {
                      router.push(`${target}?petId=${pet.id}` as any);
                    }
                  }}
                  style={{ backgroundColor: colors.bgSubtle, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center' }}
                >
                  {pet.avatar_url ? (
                    <Image source={{ uri: pet.avatar_url }} style={{ width: 44, height: 44, borderRadius: 12 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' }}>
                      <PawPrint size={20} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{pet.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{pet.breed} - {pet.age || 'Unknown age'}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setPetPickerTarget(null)}
              style={{ marginTop: 16, alignItems: 'center', paddingVertical: 12 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={isCommentModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "75%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Comments</Text>
              <Pressable onPress={() => setIsCommentModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              {(latestPost?.comments || []).length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: "center", opacity: 0.55 }}>
                  <MessageCircle size={36} color={colors.textMuted} />
                  <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 14 }}>No comments yet</Text>
                </View>
              ) : (
                (latestPost?.comments || []).map((comment: any) => (
                  <View key={comment.id} style={{ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    {comment.author?.avatar_url ? (
                      <Image source={{ uri: comment.author.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSubtle, alignItems: "center", justifyContent: "center" }}>
                        <PawPrint size={16} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{comment.author?.name || "Member"}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>{timeAgo(comment.createdAt)}</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 4, lineHeight: 20 }}>{comment.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TextInput
                placeholder="Write a comment..."
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                style={{ minHeight: 56, maxHeight: 120, padding: 14, backgroundColor: colors.bgSubtle, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, textAlignVertical: "top" }}
              />
              <Pressable
                onPress={handleAddComment}
                disabled={commentSubmitting}
                style={{ marginTop: 12, backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 14, alignItems: "center", opacity: commentSubmitting ? 0.7 : 1 }}
              >
                {commentSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Post Comment</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
