import React from 'react';
import { useColorScheme } from 'nativewind';
import OnboardingLayout from './OnboardingLayout';

const OnboardingStep3 = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <OnboardingLayout
      title="Smart Living Services"
      description="Book amenities, report issues, and stay updated with instant community notifications."
      image={isDark ? require('../../assets/images/onboarding3-dark.png') : require('../../assets/images/onboarding3.png')}
      step={3}
      totalSteps={3}
      primaryColor="#2563EB"
      onNext={() => navigation.replace('Login')} 
      onSkip={() => navigation.replace('Login')}
    />
  );
};

export default OnboardingStep3;
