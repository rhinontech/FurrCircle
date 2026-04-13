import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Pressable, Image } from 'react-native';
import { Bell, MessageCircle } from 'lucide-react-native';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';
import React, { useEffect } from 'react';
import '@/global.css';
import AppointmentFeedbackPrompt from '@/components/AppointmentFeedbackPrompt';


function GlobalHeader() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { chatUnreadCount, notifUnreadCount } = useNotifications();
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 10 }}>
        <Image
          source={isDark ? require("../assets/furrcircle_dark_logo.png") : require("../assets/furrcircle_light_logo.png")}
          style={{ width: 150, height: 45 }}
          resizeMode="contain"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => router.push('/community/chats')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}
          >
            <MessageCircle size={20} color={colors.textPrimary} />
            {chatUnreadCount > 0 && (
              <View style={{ position: 'absolute', top: 8, right: 8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: colors.bgCard }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{chatUnreadCount > 9 ? '9+' : chatUnreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}
          >
            <Bell size={20} color={colors.textPrimary} />
            {notifUnreadCount > 0 && (
              <View style={{ position: 'absolute', top: 8, right: 8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#f43f5e', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: colors.bgCard }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{notifUnreadCount > 9 ? '9+' : notifUnreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
      {isLoggedIn && <GlobalHeader />}
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
