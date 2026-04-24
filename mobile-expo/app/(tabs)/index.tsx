import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, FlatList, ActivityIndicator, RefreshControl, Modal, Alert, Share, KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { Syringe, Stethoscope, Calendar, Heart, PawPrint, MapPin, Star, MessageCircle, Share2, Bookmark, X, Camera } from "@/components/ui/IconCompat";
import StatusChip from "../../components/ui/StatusChip";
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useFocusEffect } from "expo-router";
import { userHomeApi } from "@/services/users/homeApi";
import { userCommunityApi } from "@/services/users/communityApi";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { G, Path } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, interpolate, Extrapolation } from 'react-native-reanimated';
import { useResponsive, MAX_CONTENT_WIDTH } from "@/hooks/useResponsive";

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


export const CustomPawPrint = ({ size = 20, color = "currentColor", style }: { size?: number, color?: string, style?: any }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" style={style}>
    <G transform="translate(0 0)">
      <Path d="M 9.076 0 L 39.965 9.076 L 30.889 39.965 L 0 30.889 Z" fill="transparent" />
      <Path d="M 23.678 21.861 C 22.096 19.14 18.662 18.131 15.859 19.563 L 9.833 22.637 C 6.409 24.3 6.979 29.569 10.682 30.457 C 12.676 30.986 14.581 30.444 16.708 31.111 C 18.934 31.723 20.318 33.1 22.255 33.858 C 25.817 34.994 29.035 30.895 27.079 27.704 L 23.678 21.86 Z M 33.722 17.691 C 31.985 16.787 29.973 18.425 29.087 20.083 C 26.38 25.228 31.373 27.828 34.172 22.888 C 35.346 20.764 35.148 18.477 33.722 17.691 Z M 25.04 18.349 C 26.874 18.888 28.978 17.241 29.73 14.683 C 31.356 8.471 25.072 6.624 23.084 12.73 C 22.332 15.288 23.211 17.812 25.04 18.349 Z M 12.271 15.142 C 12.428 13.27 11.617 10.803 9.667 10.623 C 5.996 10.483 5.304 18.192 8.638 19.192 C 10.549 19.685 12.067 17.746 12.271 15.142 Z M 16.613 15.873 C 18.443 16.411 20.546 14.764 21.298 12.206 C 22.929 5.995 16.645 4.148 14.652 10.253 C 13.901 12.811 14.779 15.334 16.613 15.873 Z" fill={color} />
    </G>
  </Svg>
);

const PaginationDot = ({ index, scrollX, cardWidth }: { index: number, scrollX: any, cardWidth: number }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * cardWidth, index * cardWidth, (index + 1) * cardWidth];
    const width = interpolate(scrollX.value, inputRange, [6, 18, 6], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
    return { width, opacity };
  });

  return <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: '#fff' }, animatedStyle]} />;
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { screenWidth, hp } = useResponsive();
  const cardWidth = Math.min(screenWidth - hp * 2, MAX_CONTENT_WIDTH - hp * 2);
  const reminderCardWidth = Math.min(screenWidth - hp * 2, 340);

  const [pets, setPets] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [vets, setVets] = useState<any[]>([]);
  const [latestPost, setLatestPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

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

  const renderPetInfoContent = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/pets/${item.id}`)}
      style={{ width: cardWidth, padding: 24 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: '#fff', padding: 3 }}>
          <View style={{ flex: 1, borderRadius: 41, overflow: 'hidden', backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <CustomPawPrint size={36} color={colors.textMuted} />
            )}
          </View>
          <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, padding: 2 }}>
            <View style={{ backgroundColor: '#3b82f6', borderRadius: 10, padding: 4 }}>
              <Camera size={12} color="#fff" />
            </View>
          </View>
        </View>

        <View style={{ flex: 1, marginLeft: 20 }}>
          <Text
            style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: '#fff', fontWeight: '600' }}>Age : {item.age || 'Age Unknown'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 1, marginVertical: 14, backgroundColor: 'rgba(255,255,255,0.1)' }} />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={require("@/assets/adaptive-icon.png")} style={{ width: 14, height: 14, tintColor: '#fff' }} />
            </View>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Weight</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>{item.weight || '--'}</Text>
        </View>

        <View style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' }} />

        <View style={{ flex: 1.2, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={14} color="#fff" />
            </View>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Health Score</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>{item.healthScore || '95'}/100</Text>
        </View>

        <View style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' }} />

        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={14} color="#fff" />
            </View>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Next Visit</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>{item.nextVisit || '--'}</Text>
        </View>
      </View>
    </Pressable>
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
        contentContainerStyle={{ paddingBottom: 40, alignItems: "center" }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={{ width: "100%", maxWidth: MAX_CONTENT_WIDTH, alignSelf: "center" }}>
        {/* Greeting */}
        <View style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 10 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>{(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning 👋' : h < 18 ? 'Good afternoon 👋' : 'Good evening 👋'; })()}</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>Hello, {user?.name?.split(' ')[0] || 'Guest'}</Text>
        </View>

        <Image
            source={require("@/assets/melon.png")}
            style={{ position: 'absolute', right: 30, top: 0, width: 140, height: 140, zIndex: 1 }}
            resizeMode="contain"
          />

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
            <View style={{ marginHorizontal: 20, borderRadius: 24, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#3b82f6', '#1e3a8a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 0 }}
              >
                {/* Background Paw Prints (Static) */}
                <CustomPawPrint size={100} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -10, top: -10, }} />
                <CustomPawPrint size={60} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: 40, bottom: 60 }} />

                <Animated.FlatList
                  data={pets}
                  renderItem={renderPetInfoContent}
                  horizontal
                  pagingEnabled
                  scrollEnabled={pets.length > 1}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={cardWidth}
                  decelerationRate="fast"
                  keyExtractor={(item) => item.id.toString()}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                />

                {/* Pagination Dots */}
                {pets.length > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 16 }}>
                    {pets.map((_, index) => (
                      <PaginationDot key={index} index={index} scrollX={scrollX} cardWidth={cardWidth} />
                    ))}
                  </View>
                )}
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Reminders section */}
        {reminders.filter(r => !r.isDone).length > 0 && (
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
                    style={{ width: reminderCardWidth, maxWidth: reminderCardWidth, backgroundColor: bg, borderRadius: 16, borderWidth: 1, borderColor: isDark ? colors.border : `${color}33`, padding: 14, marginRight: 12, overflow: "hidden" }}
                  >
                    <Icon size={18} color={color} style={{ marginBottom: 8 }} />
                    <Text style={{ width: "100%", fontSize: 14, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1} ellipsizeMode="tail">{r.title}</Text>
                    <Text style={{ width: "100%", fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1} ellipsizeMode="tail">
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
        {vets.length > 0 && <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>Nearby Vets</Text>
            <Pressable onPress={() => router.push("/(tabs)/discover?category=Vets")}>
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
        </View>}

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
