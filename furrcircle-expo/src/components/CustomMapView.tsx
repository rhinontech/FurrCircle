import React from 'react';
import MapView, { Marker } from 'react-native-maps';

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

const CustomMapView = React.forwardRef<MapView, CustomMapViewProps>((props, ref) => {
  const {
    style,
    initialRegion,
    scrollEnabled = true,
    zoomEnabled = true,
    pitchEnabled = true,
    rotateEnabled = true,
    onPress,
    markerCoordinate,
    markerPinColor,
  } = props;

  return (
    <MapView
      ref={ref}
      style={style}
      initialRegion={initialRegion}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      pitchEnabled={pitchEnabled}
      rotateEnabled={rotateEnabled}
      onPress={onPress}
    >
      {markerCoordinate && (
        <Marker coordinate={markerCoordinate} pinColor={markerPinColor} />
      )}
    </MapView>
  );
});

export default CustomMapView;
