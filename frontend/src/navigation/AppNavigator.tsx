import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../lib/auth';
import { getOnboarding } from '../lib/onboarding';

import { LandingScreen } from '../screens/LandingScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { LogInScreen } from '../screens/LogInScreen';
import { OnboardingWalkingScreen } from '../screens/OnboardingWalkingScreen';
import { OnboardingBudgetScreen } from '../screens/OnboardingBudgetScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AITripPlannerScreen } from '../screens/AITripPlannerScreen';
import { SaveTripScreen } from '../screens/SaveTripScreen';

import type {
  AuthStackParamList,
  OnboardingStackParamList,
  MainStackParamList,
} from './types';
import { colors } from '../theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

// --- Individual stacks -----------------------------------------------------

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Landing" component={LandingScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    <AuthStack.Screen name="LogIn" component={LogInScreen} />
  </AuthStack.Navigator>
);

const OnboardingNavigator = ({
  onDone,
}: {
  onDone: () => void;
}) => (
  <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
    <OnboardingStack.Screen name="OnboardingWalking">
      {(props) => <OnboardingWalkingScreen {...props} />}
    </OnboardingStack.Screen>
    <OnboardingStack.Screen name="OnboardingBudget">
      {(props) => <OnboardingBudgetScreen {...props} onDone={onDone} />}
    </OnboardingStack.Screen>
  </OnboardingStack.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="Home" component={HomeScreen} />
    <MainStack.Screen name="AITripPlanner" component={AITripPlannerScreen} />
    <MainStack.Screen name="SaveTrip" component={SaveTripScreen} />
  </MainStack.Navigator>
);

// --- Root ------------------------------------------------------------------

export const AppNavigator: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  // Re-check onboarding state whenever the session changes (a new user could
  // have just signed up on this device, so AsyncStorage might still say done).
  useEffect(() => {
    if (!session) {
      setOnboarded(null);
      return;
    }
    getOnboarding().then((o) => setOnboarded(o.completed));
  }, [session]);

  if (authLoading || (session && onboarded === null)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bgStart,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthNavigator />
      ) : !onboarded ? (
        <OnboardingNavigator onDone={() => setOnboarded(true)} />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
};
