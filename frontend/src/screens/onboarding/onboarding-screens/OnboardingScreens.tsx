import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingStep1 from '../OnboardingStep1';
import OnboardingStep2 from '../OnboardingStep2';
import OnboardingStep3 from '../OnboardingStep3';

const Stack = createNativeStackNavigator();

const OnboardingScreens = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="OnboardingStep1" component={OnboardingStep1} />
      <Stack.Screen name="OnboardingStep2" component={OnboardingStep2} />
      <Stack.Screen name="OnboardingStep3" component={OnboardingStep3} />
    </Stack.Navigator>
  );
};

export default OnboardingScreens;
