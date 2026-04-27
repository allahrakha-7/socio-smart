import React, { useState } from 'react';
import { Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator, NativeModules, StatusBar, Image } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Eye, EyeOff, User } from 'lucide-react-native';
import StatusModal, { ModalType } from '../../components/modals/StatusModal';

const PRIMARY_COLOR = '#2563EB';
import { getApiBaseUrl } from '../../utils/apiConfig';

const SignUp = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ type: ModalType; title: string; message: string }>({
    type: 'error',
    title: '',
    message: '',
  });

  const showModal = (type: ModalType, title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const handleSignUp = async () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Basic Validation
    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      showModal('error', 'Incomplete Form', 'Please fill out all fields to create your account.');
      return;
    }

    // 2. Domain Check (Residents only via SignUp)
    if (!normalizedEmail.endsWith('@gmail.com')) {
      showModal('warning', 'Restricted Domain', 'Registration is currently restricted to @gmail.com residents. Admins please contact system owner.');
      return;
    }

    // 3. Password Match
    if (password !== confirmPassword) {
      showModal('error', 'Match Failed', "The passwords you entered don't match. Please double check.");
      return;
    }

    setIsLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: normalizedName,
          email: normalizedEmail,
          password,
          role: 'resident', // Ensure role is sent as resident
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.message || 'We could not complete your registration at this time.';
        showModal('error', 'Registration Error', message);
        return;
      }

      showModal('success', 'Account Created!', 'Your account has been successfully registered. You can now sign in to explore SocioSmart.');
      setTimeout(() => {
        setModalVisible(false);
        navigation.replace('Login');
      }, 2500);
    } catch (error) {
      showModal('error', 'Network Error', 'Unable to reach SocioSmart servers. Please verify your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#FFFFFF"} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View className="px-8">

            {/* Header */}
            <Animated.View entering={FadeInUp.duration(1000).springify()} className="mb-10 items-center">
              <Image
                source={colorScheme === 'dark' ? require('../../assets/images/logo-dark.png') : require('../../assets/images/logo.png')}
                style={{ width: 140, height: 140, marginBottom: -20 }}
                resizeMode="contain"
              />
              <Text className="text-4xl font-satoshi-bold text-[#0F172A] dark:text-zinc-50 mb-2 tracking-tight">Create Account</Text>
              <Text className="text-base text-gray-500 font-satoshi-medium text-center px-4">
                Join our community and live smarter
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(200).duration(800)} className="space-y-6">
              <View>
                <Text className="text-[#1F2937] dark:text-zinc-300 font-satoshi-bold text-sm mb-2 ml-1 uppercase ">Full Name</Text>
                <TextInput
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  className="bg-gray-50 dark:bg-zinc-900 px-5 py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                />
              </View>

              <View className="mt-4">
                <Text className="text-[#1F2937] dark:text-zinc-300 font-satoshi-bold text-sm mb-2 ml-1 uppercase ">Email Address</Text>
                <TextInput
                  placeholder="Enter email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-gray-50 dark:bg-zinc-900 px-5 py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                />
              </View>

              <View className="mt-4">
                <Text className="text-[#1F2937] dark:text-zinc-300 font-satoshi-bold text-sm mb-2 ml-1 uppercase ">Password</Text>
                <View className="relative flex-row items-center">
                  <TextInput
                    placeholder="Enter password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="flex-1 bg-gray-50 dark:bg-zinc-900 pl-5 pr-12 py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                  />
                  <TouchableOpacity className="absolute right-4" onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                    {showPassword ? <EyeOff size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} /> : <Eye size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} />}
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mt-4">
                <Text className="text-[#1F2937] dark:text-zinc-300 font-satoshi-bold text-sm mb-2 ml-1 uppercase ">Confirm Password</Text>
                <View className="relative flex-row items-center">
                  <TextInput
                    placeholder="Enter confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    className="flex-1 bg-gray-50 dark:bg-zinc-900 pl-5 pr-12 py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                  />
                  <TouchableOpacity className="absolute right-4" onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={12}>
                    {showConfirmPassword ? <EyeOff size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} /> : <Eye size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} />}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Button */}
            <Animated.View entering={FadeInDown.delay(400).duration(800)} className="mt-10">
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                activeOpacity={0.8}
                style={[styles.primaryButton, { backgroundColor: isLoading ? '#93C5FD' : PRIMARY_COLOR }]}
              >
                {isLoading ? <ActivityIndicator color="white" /> : (
                  <Text className="text-white text-lg font-satoshi-bold tracking-widest uppercase">Sign Up</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Login Link */}
            <Animated.View entering={FadeInDown.delay(600).duration(800)} className="flex-row justify-center mt-8 pb-10">
              <Text className="text-gray-500 text-base font-satoshi">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: PRIMARY_COLOR }} className="text-base font-satoshi-bold">Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.type === 'success' ? 'Continue' : 'Try Again'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
  }
});

export default SignUp;
