import React, { useState } from 'react';
import { View, Pressable, Modal, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import * as Location from 'expo-location';
import { AppText as Text } from './ui/AppText';
import AppIcon from './ui/AppIcon';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';

export default function LocationHeader() {
  const { colors } = useTheme();
  const { location, fetchCurrentLocation, isLoading, setManualLocation, recentLocations } = useLocation();
  const [modalVisible, setModalVisible] = useState(false);

  // Zomato/Swiggy style format
  const displayTitle = location.city || 'Select Location';
  const displaySubtitle = location.address || 'Click to fetch current location';

  const handleUseCurrentLocation = async () => {
    await fetchCurrentLocation();
    setModalVisible(false);
  };

  return (
    <>
      <Pressable 
        onPress={() => setModalVisible(true)}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, backgroundColor: colors.bgCard }}
      >
        <View style={{ marginRight: 10 }}>
          <AppIcon name="location" size={28} color={colors.brand} weight="bold" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>
              {displayTitle}
            </Text>
            <AppIcon name="forward" size={20} color={colors.textPrimary} style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
            {displaySubtitle}
          </Text>
        </View>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select a Location</Text>
              <Pressable onPress={() => setModalVisible(false)} style={{ padding: 5 }}>
                <AppIcon name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Pressable 
              onPress={handleUseCurrentLocation}
              style={({ pressed }) => [
                styles.currentLocationBtn,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.bgSubtle }
              ]}
            >
              <AppIcon name="navigation" size={24} color={colors.brand} />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.brand }}>
                  Use current location
                </Text>
                {isLoading ? (
                   <ActivityIndicator size="small" color={colors.brand} style={{ marginTop: 4, alignSelf: 'flex-start' }} />
                ) : (
                   <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                     Using GPS
                   </Text>
                )}
              </View>
            </Pressable>

            {/* Manual Search */}
            <View style={{ padding: 15 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                Or search for a location manually
              </Text>
              <View style={{ 
                flexDirection: 'row',
                backgroundColor: colors.bgSubtle, 
                borderRadius: 14, 
                paddingHorizontal: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border
              }}>
                <TextInput
                  placeholder="Search area, street, or building..."
                  placeholderTextColor={colors.textMuted}
                  style={{ flex: 1, height: 52, color: colors.textPrimary }}
                  onSubmitEditing={async (e) => {
                    const query = e.nativeEvent.text;
                    if (!query) return;
                    try {
                      const results = await Location.geocodeAsync(query);
                      if (results.length > 0) {
                        const { latitude, longitude } = results[0];
                        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
                        let addr = query;
                        let city = null;
                        if (reverse.length > 0) {
                          const p = reverse[0];
                          addr = [p.streetNumber, p.street, p.city].filter(Boolean).join(', ') || query;
                          city = p.city;
                        }
                        setManualLocation(latitude, longitude, addr, city || undefined);
                        setModalVisible(false);
                      } else {
                        Alert.alert("Not Found", "Could not find that location. Please try being more specific.");
                      }
                    } catch (err) {
                      Alert.alert("Error", "Failed to search for location.");
                    }
                  }}
                />
                <AppIcon name="search" size={20} color={colors.textMuted} />
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
                Type and press Enter to search
              </Text>
            </View>

            {/* Recent Locations */}
            {recentLocations.length > 0 && (
              <View style={{ padding: 15, paddingTop: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Recent Searches
                </Text>
                {recentLocations.map((loc, idx) => (
                  <Pressable
                    key={`${loc.latitude}-${idx}`}
                    onPress={() => {
                      setManualLocation(loc.latitude!, loc.longitude!, loc.address!, loc.city || undefined);
                      setModalVisible(false);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      opacity: pressed ? 0.7 : 1,
                      borderBottomWidth: idx === recentLocations.length - 1 ? 0 : StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border
                    })}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <AppIcon name="history" size={18} color={colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>
                        {loc.address?.split(',')[0]}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
                        {loc.address}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  }
});
