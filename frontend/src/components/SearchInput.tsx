import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
}

export const SearchInput = ({ placeholder, value, onChangeText }: SearchInputProps) => {
  return (
    <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
      <Search color="#64748B" size={20} />
      <TextInput
        className="flex-1 ml-3 text-base text-[#0F172A]"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};
