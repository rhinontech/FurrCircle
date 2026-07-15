import React from 'react';
import { View, Text } from 'react-native';

export interface CustomMapViewProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  onPress?: (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
  markerCoordinate?: {
    latitude: number;
    longitude: number;
  };
  markerPinColor?: string;
}

const CustomMapView = React.forwardRef<any, CustomMapViewProps>((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: () => {
      // No-op on web
    }
  }));

  const { style, markerCoordinate, initialRegion } = props;
  const lat = markerCoordinate?.latitude ?? initialRegion?.latitude;
  const lng = markerCoordinate?.longitude ?? initialRegion?.longitude;

  if (lat && lng) {
    const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    return (
      <View style={style}>
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
        />
      </View>
    );
  }

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }, style]}>
      <Text style={{ color: '#4b5563', fontSize: 13, fontFamily: 'System' }}>
        Map View
      </Text>
    </View>
  );
});

export default CustomMapView;
