import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Map, MapPin } from 'lucide-react-native';

import { LandingScreen } from '../screens/LandingScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MapScreen } from '../screens/MapScreen';
import { TripPlannerScreen } from '../screens/TripPlannerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: "#0EA5E9" }}>
    <Tab.Screen 
      name="Map" 
      component={MapScreen} 
      options={{ tabBarIcon: ({color}) => <Map color={color} size={24} /> }}
    />
    <Tab.Screen 
      name="Planner" 
      component={TripPlannerScreen}
      options={{ tabBarIcon: ({color}) => <MapPin color={color} size={24} /> }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
