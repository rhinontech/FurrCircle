import React, { useState, useRef } from "react";
import { View, Text, ScrollView, Image, Pressable, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Heart, ShieldCheck, Users, Sparkles } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Welcome to FurrCircle",
    description: "Your all-in-one companion for your pet's health and happiness. Professional care at your fingertips.",
    image: require("../assets/pet-dog.jpg"),
    icon: Heart,
    color: "#f43f5e",
  },
  {
    id: "2",
    title: "Track Every Milestone",
    description: "Never miss a vaccine or appointment. Our smart reminders keep your pet's medical records up to date.",
    image: require("../assets/pet-cat.jpg"),
    icon: ShieldCheck,
    color: "#10b981",
  },
  {
    id: "3",
    title: "Expert Vet Network",
    description: "Connect with certified veterinarians for consultations, checkups, and professional advice whenever you need it.",
    image: require("../assets/pet-bunny.jpg"),
    icon: Sparkles,
    color: "#0ea5e9",
  },
  {
    id: "4",
    title: "Vibrant Community",
    description: "Share stories, get advice, and join a world of passionate pet owners dedicated to their furry family members.",
    image: require("../assets/pet-dog.jpg"),
    icon: Users,
    color: "#8b5cf6",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { completeOnboarding } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace("/login");
  };

  const nextSlide = () => {
    if (activeIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      handleComplete();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Skip Button */}
      <View style={{ height: 60, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'flex-end' }}>
        {activeIndex < slides.length - 1 && (
          <Pressable onPress={handleComplete}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textMuted }}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={{ width, paddingHorizontal: 40, alignItems: 'center' }}>
            <View style={{ width: '100%', height: 320, borderRadius: 32, overflow: 'hidden', marginBottom: 40, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 }}>
              <Image source={slide.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <slide.icon size={32} color={slide.color} />
            </View>

            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 16 }}>
              {slide.title}
            </Text>
            <Text style={{ fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 24 }}>
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={{ paddingHorizontal: 40, paddingBottom: 40 }}>
        {/* Pagination Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 40, gap: 8 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === activeIndex ? colors.brand : colors.border,
              }}
            />
          ))}
        </View>

        {/* Action Button */}
        <Pressable
          onPress={nextSlide}
          style={{
            height: 64,
            backgroundColor: colors.brand,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            shadowColor: colors.brand,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>
            {activeIndex === slides.length - 1 ? "Get Started" : "Next Step"}
          </Text>
          <ChevronRight size={20} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
