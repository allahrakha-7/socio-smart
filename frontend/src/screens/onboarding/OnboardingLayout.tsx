import { Text, View, TouchableOpacity, Dimensions, ImageSourcePropType, StyleSheet, StatusBar } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  Layout
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface OnboardingLayoutProps {
  title: string;
  description: string;
  image: ImageSourcePropType;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  primaryColor: string;
}
const OnboardingLayout = ({
  title,
  description,
  image,
  step,
  totalSteps,
  onNext,
  onSkip,
  primaryColor
}: OnboardingLayoutProps) => {
  const { colorScheme } = useColorScheme();
  const getDotStyle = (isActive: boolean) => {
    return [
      styles.dotBase,
      isActive ? styles.dotActive : [styles.dotInactive, colorScheme === 'dark' && { backgroundColor: '#3F3F46' }],
      isActive ? getDotActiveColorStyle(primaryColor) : null,
    ];
  };

  const getButtonStyle = () => {
    return [styles.buttonBase, getButtonDynamicStyle(primaryColor)];
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 px-6">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#FFFFFF"} />
      <TouchableOpacity
        className="absolute top-12 right-10 z-10"
        onPress={onSkip}
      >
        <Text className="text-gray-400 dark:text-zinc-500 text-lg font-satoshi-medium">Skip</Text>
      </TouchableOpacity>

      <View className="flex-1 items-center justify-center pt-8 pb-4">
        <Animated.Image
          entering={FadeInUp.delay(200).duration(1000).springify()}
          source={image}
          style={{ width: width * 0.8, height: width * 0.8 }}
          resizeMode="contain"
          className="mb-8"
        />

        <View className="items-center px-4">
          <Animated.Text
            entering={FadeInDown.delay(300).duration(800)}
            className="text-[25px] font-satoshi-bold text-gray-900 dark:text-zinc-50 text-center mb-4"
          >
            {title}
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(400).duration(800)}
            className="text-lg text-gray-500 dark:text-zinc-500 text-center leading-7 mb-4"
          >
            {description}
          </Animated.Text>
        </View>
      </View>

      <View className="mb-12 px-2 items-center">
        <View className="flex-row mb-10">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const isActive = index === step - 1;
            return (
              <Animated.View
                key={index}
                layout={Layout.springify()}
                style={getDotStyle(isActive)}
              />
            );
          })}
        </View>
        <TouchableOpacity
          onPress={onNext}
          activeOpacity={0.8}
          className="w-full"
        >
          <Animated.View
            entering={FadeInRight.delay(500)}
            style={getButtonStyle()}
          >
            <Text className="text-white text-xl font-satoshi-bold">
              {step === totalSteps ? 'GET STARTED' : 'NEXT'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingLayout;

const styles = StyleSheet.create({
  dotBase: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    opacity: 1,
  },
  dotInactive: {
    width: 8,
    opacity: 0.4,
    backgroundColor: '#E5E7EB',
  },
  buttonBase: {
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
});

const getDotActiveColorStyle = (primaryColor: string) => {
  return { backgroundColor: primaryColor };
};

const getButtonDynamicStyle = (primaryColor: string) => {
  return {
    backgroundColor: primaryColor,
    shadowColor: primaryColor,
    shadowOffset: {
      width: 50,
      height: 4
    },
  };
};
