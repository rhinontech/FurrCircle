import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, Calendar, Clock, AlertCircle, Syringe, ClipboardList, CheckCircle } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusChip from "../../components/ui/StatusChip";
import { api } from "../../services/api";

export default function RemindersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await api.get('/reminders');
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReminders();
  };

  const toggleReminder = async (id: string) => {
    try {
      // Optimistic update
      setReminders(prev => prev.map(r => r.id === id ? { ...r, isDone: !r.isDone } : r));
      await api.patch(`/reminders/${id}/toggle`);
    } catch (error) {
      console.error("Error toggling reminder", error);
      // Revert if failed
      fetchReminders();
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'vaccine': return Syringe;
      case 'appointment': return Calendar;
      case 'medication': return ClipboardList;
      default: return Bell;
    }
  };

  const getStatus = (r: any) => {
    if (r.isDone) return 'completed';
    if (!r.date) return 'pending';
    const isOverdue = new Date(r.date) < new Date();
    return isOverdue ? 'urgent' : 'upcoming';
  };

  const upcoming = reminders.filter(r => !r.isDone);
  const completed = reminders.filter(r => r.isDone);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginRight: 40 }}>Reminders</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {upcoming.length === 0 && (
           <View style={{ paddingVertical: 40, alignItems: 'center', opacity: 0.5 }}>
             <Bell size={48} color={colors.textMuted} strokeWidth={1} />
             <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 14 }}>No upcoming reminders</Text>
           </View>
        )}

        {upcoming.map((r) => {
          const status = getStatus(r);
          const bgIcon = status === 'urgent' ? '#fff1f2' : colors.bgSubtle;
          const iconColor = status === 'urgent' ? '#e11d48' : colors.brand;
          const variant = status === 'urgent' ? 'danger' : 'info';
          const Icon = getIcon(r.type);

          return (
            <Pressable 
              key={r.id.toString()} 
              onPress={() => toggleReminder(r.id)}
              style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: bgIcon, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={iconColor} />
              </View>
              <View style={{ flex: 1, minWidth: 0, marginLeft: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={2}>{r.title}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                  {r.pet?.name || 'General'} · Due {r.date ? new Date(r.date).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={{ marginLeft: 12, alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' }}>
                <StatusChip label={status.charAt(0).toUpperCase() + status.slice(1)} variant={variant} />
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.textMuted, opacity: 0.3, marginTop: 12 }} />
              </View>
            </Pressable>
          );
        })}

        {completed.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted, marginBottom: 12, textTransform: 'uppercase' }}>Recently Completed</Text>
            <View style={{ gap: 8 }}>
              {completed.map(r => (
                <Pressable 
                  key={r.id.toString()}
                  onPress={() => toggleReminder(r.id)}
                  style={{ backgroundColor: colors.bgSubtle, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', opacity: 0.7 }}
                >
                  <CheckCircle size={20} color="#10b981" style={{ marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: 14, color: colors.textSecondary, textDecorationLine: 'line-through' }}>{r.title} ({r.pet?.name || 'General'})</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{r.date ? new Date(r.date).toLocaleDateString() : ''}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
