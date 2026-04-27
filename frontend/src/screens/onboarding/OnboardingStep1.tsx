import React from 'react';
import { useColorScheme } from 'nativewind';
import OnboardingLayout from './OnboardingLayout';

const OnboardingStep1 = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <OnboardingLayout
      title="Secure Your Community"
      description="Manage visitors and ensure safety with real-time alerts and digital approvals for your peace of mind."
      image={isDark ? require('../../assets/images/onboarding1-dark.png') : require('../../assets/images/onboarding1.png')}
      step={1}
      totalSteps={3}
      primaryColor="#2563EB"
      onNext={() => navigation.navigate('OnboardingStep2')}
      onSkip={() => navigation.replace('Login')}
    />
  );
};

export default OnboardingStep1;
