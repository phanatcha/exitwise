import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export const TripPlannerScreen = () => {
  return (
    <View className="flex-1 bg-[#F8FAFC] p-4 pt-12">
      <Text className="text-3xl font-bold text-[#0F172A] mb-6">Your Itinerary</Text>
      <ScrollView>
        <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
           <Text className="text-lg text-[#0EA5E9] font-bold mb-1">Recommended Route</Text>
           <Text className="text-xl font-bold text-[#0F172A]">Take BTS to Ari, Exit 3</Text>
           <Text className="text-base text-[#64748B] mt-2">Walk 120m to Qottontale Cafe</Text>
        </View>
      </ScrollView>
    </View>
  );
};
