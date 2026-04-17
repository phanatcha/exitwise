import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
}

export const Button = ({ title, onPress, variant = 'primary', loading = false }: ButtonProps) => {
  const baseStyles = "py-3 px-6 rounded-full flex-row justify-center items-center";
  const variants = {
    primary: "bg-[#0EA5E9]",
    secondary: "bg-[#06B6D4]",
    outline: "bg-transparent border-2 border-[#0EA5E9]"
  };
  const textVariants = {
    primary: "text-white font-bold text-lg",
    secondary: "text-white font-bold text-lg",
    outline: "text-[#0EA5E9] font-bold text-lg"
  };

  return (
    <TouchableOpacity 
      className={`${baseStyles} ${variants[variant]}`}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#0EA5E9' : '#fff'} />
      ) : (
        <Text className={textVariants[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
