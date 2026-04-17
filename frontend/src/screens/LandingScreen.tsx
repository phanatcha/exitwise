import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../components/Button';

export const LandingScreen = ({ navigation }: any) => {
  return (
    <View className="flex-1 bg-[#F8FAFC] justify-center items-center px-6">
      <Text className="text-4xl font-bold text-[#0F172A] mb-4">ExitWise</Text>
      <Text className="text-lg text-[#64748B] text-center mb-12">
        A station-based life helper. Never walk further than you explicitly want to.
      </Text>
      <View className="w-full">
        <Button 
          title="Get Started" 
          onPress={() => navigation.navigate('Onboarding')}
        />
      </View>
    </View>
  );
};
