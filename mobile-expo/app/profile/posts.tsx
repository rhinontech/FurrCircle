import React from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Heart, MessageCircle, Share2, MoreVertical } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import StatusChip from "../../components/ui/StatusChip";

export default function MyPostsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const avatar = user?.avatar ? { uri: user.avatar } : require("../../assets/pet-dog.jpg");
  
  const myPosts = [
    { id: 1, petTag: "Luna", category: "Health", time: "2h ago", text: "Just got Luna's vaccines updated! The vet was amazing and she barely noticed. Highly recommend PawCare Clinic! 🐱💉", image: require("../../assets/pet-cat.jpg"), likes: 24, comments: 5, status: "Approved" },
    { id: 2, petTag: "Buddy", category: "Training", time: "5h ago", text: "Finally mastered 'shake paw' after 2 weeks of training! Consistency is key. Any tips for 'roll over'? 🐕", likes: 42, comments: 12, status: "Approved" },
    { id: 3, petTag: "Buddy", category: "Health", time: "Just now", text: "Checkup and heartworm prevention day. Stay healthy everyone!", status: "Pending Verification" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>My Contributions</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {myPosts.map((post) => (
          <View key={post.id} style={{ backgroundColor: colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}>
             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={avatar} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{user?.name}</Text>
                      <StatusChip label={post.petTag} variant="info" />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>{post.time} · {post.category}</Text>
                  </View>
                </View>
                <StatusChip label={post.status} variant={post.status === 'Approved' ? 'success' : 'info'} />
             </View>

             <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 22, marginBottom: 12 }}>{post.text}</Text>
             
             {post.image && (
                <Image source={post.image} style={{ width: '100%', height: 160, borderRadius: 16, marginBottom: 12 }} resizeMode="cover" />
             )}

             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Heart size={18} color={post.likes ? colors.brand : colors.textMuted} fill={post.likes ? colors.brand : 'transparent'} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{post.likes || 0}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MessageCircle size={18} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{post.comments || 0}</Text>
                </View>
                <Share2 size={18} color={colors.textMuted} />
                <Pressable style={{ marginLeft: 'auto' }}>
                  <MoreVertical size={18} color={colors.textMuted} />
                </Pressable>
             </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
