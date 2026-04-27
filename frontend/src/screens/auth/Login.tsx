import React, { useState } from 'react';
import { Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View, Alert, ActivityIndicator, NativeModules, StatusBar, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiBaseUrl, default as api } from '../../utils/apiConfig';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import StatusModal, { ModalType } from '../../components/modals/StatusModal';

const PRIMARY_COLOR = '#2563EB';
const API_PORT = 5000;
const SESSION_KEY = '@sociosmart/session_v1';
const LEGACY_ADMIN_SESSION_KEY = '@sociosmart/admin_session_v1';
const SESSION_MS: Record<'admin' | 'resident' | 'guard', number> = {
  admin: 30 * 24 * 60 * 60 * 1000,
  resident: 90 * 24 * 60 * 60 * 1000,
  guard: 12 * 60 * 60 * 1000,
};


const Login = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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


  // Inside Login.tsx -> handleLogin function

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword) {
      showModal('error', 'Missing Fields', 'Please enter both your registered email and password to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        email: normalizedEmail,
        password: normalizedPassword
      });

      const data = response.data;
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, expiresAt }));
      await AsyncStorage.setItem('@sociosmart/last_email', normalizedEmail);

      if (data.role === 'resident' && data.status === 'pending') {
        navigation.reset({ index: 0, routes: [{ name: 'ApprovalPending' }] });
        return;
      }

      const target = data.role === 'admin' ? 'Dashboard' : data.role === 'guard' ? 'GuardDashboard' : 'ResidentDashboard';
      navigation.reset({ index: 0, routes: [{ name: target }] });

    } catch (error: any) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          showModal('error', 'Invalid Credentials', 'The email or password you entered is incorrect. Please check and try again.');
          return;
        }
        if (status === 403) {
          navigation.navigate('ApprovalPending');
          return;
        }
        showModal('error', 'Login Failed', data.message || 'An unexpected error occurred during login.');
      } else {
        showModal('error', 'Network Connection Failed', 'Unable to connect to SocioSmart servers. Please check your internet connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#FFFFFF"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-8">

            {/* Header Section */}
            <Animated.View entering={FadeInUp.duration(1000).springify()} className="mb-12 items-center">
              <Image
                source={colorScheme === 'dark' ? require('../../assets/images/logo-dark.png') : require('../../assets/images/logo.png')}
                style={{ width: 160, height: 160, marginBottom: -20 }}
                resizeMode="contain"
              />
              <Text className="text-4xl font-satoshi-bold text-[#0F172A] dark:text-zinc-50 mb-3 tracking-tight">
                Welcome Back
              </Text>
              <Text className="text-base text-gray-500 dark:text-zinc-400 font-satoshi-medium text-center">
                Enter your credentials to access your account
              </Text>
            </Animated.View>

            {/* Input Form Section */}
            <Animated.View entering={FadeInDown.delay(200).duration(800)} className="space-y-6">
              <View>
                <Text className="text-[#1F2937] dark:text-zinc-400 font-satoshi-bold text-sm mb-2 ml-1 uppercase tracking-wider">Email Address</Text>
                <View className="relative flex-row items-center">
                  <TextInput
                    placeholder="Enter registered email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 bg-gray-50 dark:bg-zinc-900 pl-5 pr-5 py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                  />
                </View>
              </View>

              <View>
                <Text className="text-[#1F2937] dark:text-zinc-400 font-satoshi-bold text-sm mt-4 mb-2 ml-1 uppercase tracking-wider">Password</Text>
                <View className="relative flex-row items-center">
                  <TextInput
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="flex-1 bg-gray-50 dark:bg-zinc-900 pl-5 pr-12 py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                    placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                  />
                  <TouchableOpacity
                    className="absolute right-4"
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={12}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} />
                    ) : (
                      <Eye size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  className="mt-6 self-end"
                >
                  <Text style={{ color: PRIMARY_COLOR }} className="text-base font-satoshi-bold">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Actions Section */}
            <Animated.View entering={FadeInDown.delay(400).duration(800)} className="mt-12">
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
                style={[
                  styles.primaryButton,
                  { backgroundColor: isLoading ? '#93C5FD' : PRIMARY_COLOR }
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-lg font-satoshi-bold tracking-widest">
                    SIGN IN
                  </Text>
                )}
              </TouchableOpacity>

            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInDown.delay(600).duration(800)} className="flex-row justify-center mt-10">
              <Text className="text-gray-500 dark:text-zinc-400 text-base font-satoshi">New here? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={{ color: PRIMARY_COLOR }} className="text-base font-satoshi-bold">
                  Create Account
                </Text>
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
        buttonText="Try Again"
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
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
  }
});

export default Login;
