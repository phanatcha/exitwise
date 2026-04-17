import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Button } from '../components/Button';

export const OnboardingScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1);
  const [walkingLimit, setWalkingLimit] = useState("500");
  const [budget, setBudget] = useState("150");

  const handleNext = () => {
    if (step === 1) setStep(2);
    else navigation.replace('MainTabs');
  };

  return (
    <View className="flex-1 bg-white p-6 justify-center">
      {step === 1 ? (
        <View>
          <Text className="text-2xl font-bold text-[#0F172A] mb-4">
            How far are you willing to walk? (meters)
          </Text>
          <TextInput 
            className="border border-gray-200 rounded-xl p-4 text-lg mb-6 text-[#0F172A]"
            keyboardType="numeric"
            value={walkingLimit}
            onChangeText={setWalkingLimit}
          />
        </View>
      ) : (
        <View>
          <Text className="text-2xl font-bold text-[#0F172A] mb-4">
            What's your comfortable spending range? (Baht)
          </Text>
          <TextInput 
            className="border border-gray-200 rounded-xl p-4 text-lg mb-6 text-[#0F172A]"
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
        </View>
      )}
      <Button title={step === 1 ? "Next" : "Finish"} onPress={handleNext} />
    </View>
  );
};
