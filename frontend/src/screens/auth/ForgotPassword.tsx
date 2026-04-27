import React, { useState } from 'react';
import { Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator, NativeModules, StatusBar } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { KeyRound } from 'lucide-react-native';
import StatusModal, { ModalType } from '../../components/modals/StatusModal';

const PRIMARY_COLOR = '#2563EB';
import { getApiBaseUrl } from '../../utils/apiConfig';

const ForgotPassword = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [email, setEmail] = useState('');
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

  const handleRecoverPassword = async () => {
    if (!email) {
      showModal('error', 'Missing Email', 'Please provide your registered email address to receive a recovery link.');
      return;
    }

    setIsLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showModal('error', 'Recovery Failed', data.message || 'We could not find an account associated with this email.');
        return;
      }

      showModal('success', 'Recovery Email Sent', 'We have sent password reset instructions to your email address. Please check your inbox and spam folder.');
      setTimeout(() => {
        setModalVisible(false);
        navigation.goBack();
      }, 3000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      showModal('error', 'Network Timeout', 'Unable to reach the server. Please check your internet connection and try again.');
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
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-evenly' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-8 py-10">
            {/* Header Section */}
            <Animated.View entering={FadeInUp.duration(1000).springify()} className="mb-12 items-center">
              <View className="w-20 h-20 bg-blue-50 dark:bg-zinc-900 rounded-full items-center justify-center mb-6 shadow-sm">
                <KeyRound size={40} color={PRIMARY_COLOR} strokeWidth={2.5} />
              </View>
              <Text className="text-4xl font-satoshi-bold text-[#0F172A] dark:text-zinc-50 mb-3 tracking-tight text-center">
                Reset Password
              </Text>
              <Text className="text-base text-gray-500 dark:text-zinc-400 font-satoshi-medium text-center leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </Text>
            </Animated.View>

            {/* Input Form Section */}
            <Animated.View entering={FadeInDown.delay(200).duration(800)} className="space-y-6">
              <View>
                <Text className="text-[#1F2937] dark:text-zinc-400 font-satoshi-bold text-xs mb-2 ml-1 uppercase tracking-widest">Email Address</Text>
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
            </Animated.View>

            {/* Actions Section */}
            <Animated.View entering={FadeInDown.delay(400).duration(800)} className="mt-12">
              <TouchableOpacity
                onPress={handleRecoverPassword}
                disabled={isLoading}
                activeOpacity={0.8}
                style={[
                  styles.primaryButton,
                  // eslint-disable-next-line react-native/no-inline-styles
                  { backgroundColor: isLoading ? '#93C5FD' : PRIMARY_COLOR }
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-lg font-satoshi-bold tracking-widest">
                    SEND RESET LINK
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).duration(800)} className="mt-10 items-center">
              <Text className="text-gray-400 dark:text-zinc-500 text-base font-satoshi-medium text-center px-6 leading-relaxed">
                Remember your password?{' '}
                <Text
                  style={{ color: PRIMARY_COLOR }}
                  className="font-satoshi-bold"
                  onPress={() => navigation.goBack()}
                >
                  Go back & Sign in
                </Text>
              </Text>
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
        buttonText={modalConfig.type === 'success' ? 'Back to Login' : 'Try Again'}
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

export default ForgotPassword;
