import * as Location from 'expo-location';

export const requestLocationPermissions = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn("Location permission not granted");
    return null;
  }

  let location = await Location.getCurrentPositionAsync({});
  return location;
};
