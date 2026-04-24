import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Pressable, Image, Platform, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';
import React, { useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import '@/global.css';
import AppointmentFeedbackPrompt from '@/components/AppointmentFeedbackPrompt';
import AppIcon from '@/components/ui/AppIcon';


function GlobalHeader() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { chatUnreadCount, notifUnreadCount } = useNotifications();

  // Determine if we are already on a "utility" screen to avoid stacking them
  const isOnUtility = segments[0] === 'notifications' || segments.includes('chats');

  const handleNavigate = (path: string) => {
    if (isOnUtility) {
      router.replace(path as any);
    } else {
      router.push(path as any);
    }
  };

  return (
    <View style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 1000,
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDark ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)'),
    }}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 45 : 80}
        tint={isDark ? "dark" : "light"}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          isDark ? 'rgba(18,18,18,0.4)' : 'rgba(255,255,255,0.4)',
          'transparent'
        ]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top']} >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 15 }}>
          <Image
            source={isDark ? require("../assets/furrcircle_dark_logo.png") : require("../assets/furrcircle_light_logo.png")}
            style={{ width: 140, height: 40 }}
            resizeMode="contain"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => handleNavigate('/community/chats')}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
            >
              <AppIcon name="chat" size={22} color={colors.textPrimary} weight="medium" />
              {chatUnreadCount > 0 && (
                <View style={{ position: 'absolute', top: 5, right: 5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: colors.bgCard }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{chatUnreadCount > 9 ? '9+' : chatUnreadCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => handleNavigate('/notifications')}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
            >
              <AppIcon name="notifications" size={22} color={colors.textPrimary} weight="medium" />
              {notifUnreadCount > 0 && (
                <View style={{ position: 'absolute', top: 5, right: 5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#f43f5e', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: colors.bgCard }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{notifUnreadCount > 9 ? '9+' : notifUnreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function AppShell() {
  const { isDark, colors } = useTheme();
  const { isLoggedIn, user, hasCompletedOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Do not redirect if state is still loading
    if (hasCompletedOnboarding === null) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(vet-tabs)';
    const inPublicGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'onboarding';
    
    if (!hasCompletedOnboarding && segments[0] !== 'onboarding') {
      // Redirect to onboarding if not completed
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && !isLoggedIn && !inPublicGroup && segments.length > 0) {
      // Redirect to login if not logged in and trying to access private routes
      router.replace('/login');
    } else if (isLoggedIn) {
      const isVet = user?.role === 'veterinarian';
      const isUnverifiedVet = isVet && user?.isVerified === false;

      // Unverified vet: keep them on pending screen only
      if (isUnverifiedVet) {
        if (segments[0] !== 'verification-pending') {
          router.replace('/verification-pending');
        }
        return;
      }

      // If at root or on public pages, redirect to appropriate dashboard
      if (!segments[0] || inPublicGroup) {
        router.replace(isVet ? '/(vet-tabs)/dashboard' : '/(tabs)');
        return;
      }

      // Role-based segment protection
      if (isVet && segments[0] === '(tabs)') {
        router.replace('/(vet-tabs)/dashboard');
      } else if (!isVet && segments[0] === '(vet-tabs)') {
        router.replace('/(tabs)');
      }
    }
  }, [isLoggedIn, hasCompletedOnboarding, segments, user?.role]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="verification-pending" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(vet-tabs)" />
          <Stack.Screen name="pets/add" />
          <Stack.Screen name="pets/[id]" />
          <Stack.Screen name="health/vitals" />
          <Stack.Screen name="health/records" />
          <Stack.Screen name="health/vaccines" />
          <Stack.Screen name="health/meds" />
          <Stack.Screen name="health/add-record" />
          <Stack.Screen name="health/add-vital" />
          <Stack.Screen name="health/add-vaccine" />
          <Stack.Screen name="health/add-med" />
          <Stack.Screen name="health/add-allergy" />
          <Stack.Screen name="reminders/index" />
          <Stack.Screen name="appointments/book" />
          <Stack.Screen name="appointments/[id]" />
          <Stack.Screen name="appointments/index" />
          <Stack.Screen name="notifications/index" />
          <Stack.Screen name="community/events" />
          <Stack.Screen name="community/events/[id]" />
          <Stack.Screen name="community/posts/[id]" />
          <Stack.Screen name="community/chats" />
          <Stack.Screen name="community/chat/[id]" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="vet-profile/appointment-history" />
          <Stack.Screen name="vet-profile/patients" />
          <Stack.Screen name="vet-profile/reviews" />
          <Stack.Screen name="vet-profile/working-hours" />
          <Stack.Screen name="vet-profile/verification" />
          <Stack.Screen name="vets/[id]" />
          <Stack.Screen name="adoptions/apply" />
        </Stack>
      </View>
      {isLoggedIn && <GlobalHeader />}
      <AppointmentFeedbackPrompt />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppShell />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
