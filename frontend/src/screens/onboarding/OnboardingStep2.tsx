import React from 'react';
import { useColorScheme } from 'nativewind';
import OnboardingLayout from './OnboardingLayout';

const OnboardingStep2 = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <OnboardingLayout
      title="Connect with Neighbors"
      description="Share updates, organize events, and build meaningful relationships within your local community."
      image={isDark ? require('../../assets/images/onboarding2-dark.png') : require('../../assets/images/onboarding2.png')}
      step={2}
      totalSteps={3}
      primaryColor="#2563EB"
      onNext={() => navigation.navigate('OnboardingStep3')}
      onSkip={() => navigation.replace('Login')}
    />
  );
};

export default OnboardingStep2;
