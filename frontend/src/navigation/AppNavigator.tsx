import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import { LandingScreen } from '../screens/LandingScreen';
import TripPlanScreen from '../screens/TripPlannerScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import SavedTripsScreen from '../screens/SaveTripScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { Q1 } from '../screens/Q1Screen';
import { Q2 } from '../screens/Q2Screen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// MainTabs มีครบ 3 tab ที่ต้องการ
// tabBarStyle: display none เพราะทุกหน้าทำ custom bottom nav เอง
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { display: 'none' },
    }}
  >
    <Tab.Screen name="Map" component={MapScreen} />
    <Tab.Screen name="TripPlan" component={TripPlanScreen} />
    <Tab.Screen name="SavedTrips" component={SavedTripsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />  {/* เพิ่มตรงนี้ */}
  </Tab.Navigator>
);
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Landing">
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Q1" component={Q1} />
        <Stack.Screen name="Q2" component={Q2} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SavedTrips" component={SavedTripsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};