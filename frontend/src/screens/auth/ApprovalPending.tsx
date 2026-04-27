// src/screens/auth/ApprovalPending.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, RefreshCcw, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { StatusBar } from 'react-native';

const ApprovalPending = ({ navigation }: any) => {
    const { colorScheme } = useColorScheme();
    const [isChecking, setIsChecking] = useState(false);

    const checkStatus = async () => {
        setIsChecking(true);
        try {
            // In a real app, you'd fetch the latest profile status from the backend here
            // For now, we simulate a check or just force a re-login
            Alert.alert("Status Sync", "Your account is still under review by the SocioSmart Admin.");
        } finally {
            setIsChecking(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 px-8 justify-center items-center">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#FFFFFF"} />
            <Image 
                source={colorScheme === 'dark' ? require('../../assets/images/logo-dark.png') : require('../../assets/images/logo.png')}
                style={{ width: 150, height: 150, marginBottom: -20 }}
                resizeMode="contain"
            />

            <Text className="text-4xl font-satoshi-bold text-[#0F172A] dark:text-zinc-50 text-center">Under Review</Text>

            <Text className="text-base text-gray-500 dark:text-zinc-400 font-satoshi-medium text-center mt-4 leading-relaxed px-5">
                Your registration request has been sent to the society office. You will gain full access once an administrator verifies your unit details.
            </Text>

            <TouchableOpacity
                onPress={checkStatus}
                disabled={isChecking}
                activeOpacity={0.8}
                className="mt-12 bg-[#2563EB] dark:bg-blue-600 w-full py-4 rounded-full flex-row items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-none"
            >
                {isChecking ? <ActivityIndicator color="white" /> : (
                    <>
                        <RefreshCcw size={18} color="white" className="mr-2" />
                        <Text className="text-white font-satoshi-bold text-base uppercase tracking-widest ml-2">Check Status</Text>
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} className="mt-8">
                <View className="flex-row items-center">
                    <LogOut size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-bold text-sm uppercase tracking-widest ml-2">Sign Out</Text>
                </View>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ApprovalPending;
