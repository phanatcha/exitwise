import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Train } from 'lucide-react-native';

interface StationCardProps {
  name: string;
  distance?: number; // distance in meters
  onPress: () => void;
}

export const StationCard = ({ name, distance, onPress }: StationCardProps) => {
  return (
    <TouchableOpacity 
      className="bg-white p-4 rounded-xl shadow-sm mb-3 flex-row items-center border border-gray-100"
      onPress={onPress}
    >
      <View className="bg-[#E0F2FE] p-3 rounded-full mr-4">
        <Train color="#0EA5E9" size={24} />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-[#0F172A]">{name}</Text>
        {distance !== undefined && (
          <Text className="text-sm text-[#64748B] mt-1">{distance}m away</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
