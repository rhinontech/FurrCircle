import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Pressable } from 'react-native';
import { Heart, Bell } from 'lucide-react-native';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import React, { useEffect } from 'react';
import '@/global.css';


function GlobalHeader() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Heart size={24} color={colors.brand} fill={colors.brand} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginLeft: 8 }}>PawsHub</Text>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' }}
        >
          <Bell size={20} color={colors.textPrimary} />
          <View style={{ position: 'absolute', top: 8, right: 10, width: 8, height: 8, backgroundColor: '#f43f5e', borderRadius: 4, borderWidth: 1, borderColor: colors.bgCard }} />
        </Pressable>
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
        <Stack.Screen name="health/add-allergy" />
        <Stack.Screen name="reminders/index" />
        <Stack.Screen name="appointments/book" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="community/events" />
        <Stack.Screen name="community/events/[id]" />
        <Stack.Screen name="community/posts/[id]" />
        <Stack.Screen name="community/chat/[id]" />
        <Stack.Screen name="vets/[id]" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
