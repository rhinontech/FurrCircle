import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Calendar, Syringe, ClipboardList, CheckCircle, Pencil, Trash2 } from "@/components/ui/IconCompat";
import { useTheme } from "../../contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusChip from "../../components/ui/StatusChip";
import { userRemindersApi } from "@/services/users/remindersApi";
import AppIcon from "@/components/ui/AppIcon";

export default function RemindersScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await userRemindersApi.listReminders();
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
      setReminders(prev => prev.map(r => r.id === id ? { ...r, isDone: !r.isDone } : r));
      await userRemindersApi.toggleReminder(id);
    } catch (error) {
      console.error("Error toggling reminder", error);
      fetchReminders();
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Reminder", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setDeletingId(id);
          try {
            await userRemindersApi.deleteReminder(id);
            setReminders(prev => prev.filter(r => r.id !== id));
          } catch (e: any) {
            Alert.alert("Error", e.message || "Could not delete reminder.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
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
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <AppIcon name="back" size={20} color={colors.textPrimary} weight="semibold" />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>Reminders</Text>
        <Pressable
          onPress={() => router.push("/reminders/edit")}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brand, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
        >
          <AppIcon name="add" size={15} color="#fff" weight="bold" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Add</Text>
        </Pressable>
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

          const isDeleting = deletingId === r.id;
          return (
            <View
              key={r.id.toString()}
              style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}
            >
              <Pressable
                onPress={() => toggleReminder(r.id)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
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
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={() => router.push({ pathname: "/reminders/edit", params: { id: r.id } })}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSubtle ?? colors.bgCard }}
                >
                  <Pencil size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary ?? colors.textMuted }}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(r.id, r.title)}
                  disabled={isDeleting}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FFF1F1', opacity: isDeleting ? 0.6 : 1 }}
                >
                  {isDeleting ? <ActivityIndicator size="small" color="#EF4444" /> : <Trash2 size={14} color="#EF4444" />}
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Delete</Text>
                </Pressable>
              </View>
            </View>
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
