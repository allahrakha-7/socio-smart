import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatusModal, { ModalType } from '../../components/modals/StatusModal';

import { getApiBaseUrl } from '../../utils/apiConfig';

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';

const ResetPassword = ({ navigation, route }: any) => {
    const { colorScheme } = useColorScheme();
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
    // Access token safely
    const token = route.params?.token;

    React.useEffect(() => {
        if (!token) {
            showModal('error', 'Token Error', 'The security token is invalid or has expired. Please request a new reset link.');
            setTimeout(() => navigation.navigate('Login'), 3000);
        }
    }, [token, navigation]);
    console.log("Reset Token received:", token);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdatePassword = async () => {
        if (password.length < 6) {
            showModal('warning', 'Weak Password', 'For your security, your password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            showModal('error', 'Mismatch', 'The passwords you entered do not match. Please try again.');
            return;
        }

        setIsLoading(true);
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
                await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, expiresAt }));

                showModal('success', 'Security Updated', 'Your password has been successfully updated. Your account is now secure.');

                setTimeout(() => {
                    setModalVisible(false);
                    const target = data.role === 'admin' ? 'Dashboard' : data.role === 'guard' ? 'GuardDashboard' : 'ResidentDashboard';
                    navigation.reset({ index: 0, routes: [{ name: target }] });
                }, 2500);
            } else {
                showModal('error', 'Update Failed', data.message || 'We encountered a problem while updating your password.');
            }
        } catch (error) {
            showModal('error', 'Network Error', 'Check your connection and try again to finalize your security update.');
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
                    // This is the key for perfect centering:
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="px-8 w-full">
                        {/* Header Section */}
                        <Animated.View entering={FadeInUp.duration(1000)} className="items-center mb-10">
                            <View className="w-20 h-20 bg-blue-50 dark:bg-zinc-900 rounded-[24px] items-center justify-center mb-6 shadow-sm">
                                <ShieldCheck size={40} color={PRIMARY_COLOR} strokeWidth={2.5} />
                            </View>
                            <Text className="text-4xl font-satoshi-bold text-[#0F172A] dark:text-zinc-50 text-center tracking-tight">
                                Set New Password
                            </Text>
                            <Text className="text-base text-gray-500 dark:text-zinc-400 font-satoshi-medium text-center mt-3 px-6 leading-relaxed">
                                Ensure your new password is secure and easy to remember.
                            </Text>
                        </Animated.View>

                        {/* Input Form Section */}
                        <Animated.View entering={FadeInDown.delay(200).duration(800)} className="space-y-6">
                            <View>
                                <Text className="text-[#1F2937] dark:text-zinc-400 font-satoshi-bold text-xs mb-2 uppercase tracking-widest ml-1">New Password</Text>
                                <View className="relative flex-row items-center">
                                    <TextInput
                                        placeholder="Enter new password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        className="flex-1 bg-gray-50 dark:bg-zinc-900 px-5 py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                                        placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4"
                                        onPress={() => setShowPassword(!showPassword)}
                                        hitSlop={12}
                                    >
                                        {showPassword ? <EyeOff size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} /> : <Eye size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="mt-4">
                                <Text className="text-[#1F2937] dark:text-zinc-400 font-satoshi-bold text-xs mb-2 uppercase tracking-widest ml-1">Confirm New Password</Text>
                                <View className="relative flex-row items-center">
                                    <TextInput
                                        placeholder="Repeat your password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        className="flex-1 bg-gray-50 dark:bg-zinc-900 px-5 py-4 rounded-2xl border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-zinc-50 font-satoshi-medium"
                                        placeholderTextColor={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4"
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        hitSlop={12}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} /> : <Eye size={20} color={colorScheme === 'dark' ? '#71717A' : "#9CA3AF"} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleUpdatePassword}
                                disabled={isLoading}
                                activeOpacity={0.8}
                                style={{
                                    shadowColor: PRIMARY_COLOR,
                                    shadowOpacity: 0.3,
                                    shadowRadius: 10,
                                    elevation: 8,
                                }}
                                className={`mt-10 py-5 rounded-full items-center ${isLoading ? 'bg-blue-300' : 'bg-[#2563EB]'}`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-satoshi-bold text-lg tracking-[2px] uppercase">
                                        Update Password
                                    </Text>
                                )}
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
                buttonText={modalConfig.type === 'success' ? 'Enter Dashboard' : 'Try Again'}
            />
        </SafeAreaView>
    );
};

export default ResetPassword;
