import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ScrollText, ShieldCheck } from 'lucide-react-native';

const PRIMARY_COLOR = '#2563EB';

const LegalContent = ({ type }: { type: 'tos' | 'privacy' }) => {
    if (type === 'tos') {
        return (
            <View className="space-y-8">
                <View>
                    <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-3">1. Agreement to Terms</Text>
                    <Text className="text-[15px] font-satoshi-medium text-gray-600 dark:text-zinc-400 leading-6">
                        By accessing or using SocioSmart, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this application.
                    </Text>
                </View>

                <View>
                    <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-3">2. Service License</Text>
                    <Text className="text-[15px] font-satoshi-medium text-gray-600 dark:text-zinc-400 leading-6">
                        Permission is granted to temporarily download one copy of the materials (information or software) on SocioSmart's application for personal, non-commercial transitory viewing only.
                    </Text>
                    <View className="mt-4 pl-4 border-l-2 border-blue-100 dark:border-blue-900/30">
                        <Text className="text-[14px] font-satoshi-medium text-gray-500 dark:text-zinc-500 leading-5 mb-2">��� You may not modify or copy the materials.</Text>
                        <Text className="text-[14px] font-satoshi-medium text-gray-500 dark:text-zinc-500 leading-5 mb-2">��� Use the materials for any commercial purpose.</Text>
                        <Text className="text-[14px] font-satoshi-medium text-gray-500 dark:text-zinc-500 leading-5">��� Attempt to decompile or reverse engineer any software.</Text>
                    </View>
                </View>

                <View>
                    <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-3">3. Management Authority</Text>
                    <Text className="text-[15px] font-satoshi-medium text-gray-600 dark:text-zinc-400 leading-6">
                        As a member of a Managed Society, you acknowledge that the Society Board/Management has the final authority over account approvals, community posts, and facility bookings managed through this platform.
                    </Text>
                </View>

                <View>
                    <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-3">4. Disclaimer</Text>
                    <Text className="text-[15px] font-satoshi-medium text-gray-600 dark:text-zinc-400 leading-6 italic">
                        The materials on SocioSmart are provided on an 'as is' basis. SocioSmart makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability.
                    </Text>
                </View>

                <View>
                    <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-3">5. Governance</Text>
                    <Text className="text-[15px] font-satoshi-medium text-gray-600 dark:text-zinc-400 leading-6">
                        These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which the society is registered and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="space-y-8">
            <View>
                <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-3">1. Information We Collect</Text>
                <Text className="text-[15px] font-satoshi-medium text-gray-600 dark:text-zinc-400 leading-6 mb-4">
                    We collect several types of information from and about users of our App, including:
                </Text>
                <View className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm mb-1">Personal Data</Text>
                    <Text className="text-gray-500 dark:text-zinc-500 text-xs mb-3">Name, email, phone number, and physical unit address.</Text>

                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm mb-1">Device Data</Text>
                    <Text className="text-gray-500 dark:text-zinc-500 text-xs mb-3">IP address, device OS, and unique device identifiers.</Text>

                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-sm mb-1">Access Logs</Text>
                    <Text className="text-gray-500 dark:text-zinc-500 text-xs text-xs">Gate entry/exit times and vehicle recognition records.</Text>
                </View>
            </View>

            <View>
                <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-3">2. How We Use Data</Text>
                <Text className="text-[15px] font-satoshi-medium text-gray-600 dark:text-zinc-400 leading-6">
                    We use information that we collect about you or that you provide to us to:
                </Text>
                <View className="mt-3 space-y-2">
                    <Text className="text-gray-600 dark:text-zinc-400 text-sm">��� Validate society membership and access.</Text>
                    <Text className="text-gray-600 dark:text-zinc-400 text-sm">��� Provide real-time security alerts and notifications.</Text>
                    <Text className="text-gray-600 dark:text-zinc-400 text-sm">��� Facilitate community interaction and billing.</Text>
                </View>
            </View>

            <View>
                <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-3">3. Data Retention</Text>
                <Text className="text-[15px] font-satoshi-medium text-gray-600 dark:text-zinc-400 leading-6">
                    We retain your personal information for as long as you are a registered member of the society. Gate logs are typically archived for a period of up to 2 years for security audit purposes.
                </Text>
            </View>

            <View>
                <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-3">4. Security of Information</Text>
                <Text className="text-[15px] font-satoshi-medium text-gray-600 dark:text-zinc-400 leading-6">
                    We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All transit data is encrypted via SSL/TLS protocols.
                </Text>
            </View>
        </View>
    );
};


const Legal = () => {
    const navigation = useNavigation<any>();
    const { colorScheme } = useColorScheme();
    const [activeTab, setActiveTab] = useState<'tos' | 'privacy'>('tos');

    return (
        <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950" edges={['top']}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />

            {/* Header */}
            <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 items-center justify-center mr-4"
                >
                    <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
                </TouchableOpacity>
                <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Legal Information</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Tabs */}
                <View className="flex-row mt-6 mx-6 p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl">
                    <TouchableOpacity
                        onPress={() => setActiveTab('tos')}
                        activeOpacity={0.7}
                        className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                        style={activeTab === 'tos' ? {
                            backgroundColor: colorScheme === 'dark' ? '#27272a' : '#FFFFFF',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                        } : null}
                    >
                        <ScrollText size={18} color={activeTab === 'tos' ? PRIMARY_COLOR : (colorScheme === 'dark' ? '#71717A' : '#94A3B8')} />
                        <Text className={`ml-2 text-sm font-satoshi-bold ${activeTab === 'tos' ? 'text-gray-900 dark:text-zinc-50' : 'text-gray-400 dark:text-zinc-500'}`}>Terms</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('privacy')}
                        activeOpacity={0.7}
                        className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                        style={activeTab === 'privacy' ? {
                            backgroundColor: colorScheme === 'dark' ? '#27272a' : '#FFFFFF',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                        } : null}
                    >
                        <ShieldCheck size={18} color={activeTab === 'privacy' ? PRIMARY_COLOR : (colorScheme === 'dark' ? '#71717A' : '#94A3B8')} />
                        <Text className={`ml-2 text-sm font-satoshi-bold ${activeTab === 'privacy' ? 'text-gray-900 dark:text-zinc-50' : 'text-gray-400 dark:text-zinc-500'}`}>Privacy</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View className="mt-8 px-8 pb-20">
                    <Text className="text-2xl font-satoshi-bold text-gray-900 dark:text-zinc-50 mb-6">
                        {activeTab === 'tos' ? 'Terms of Service' : 'Privacy Policy'}
                    </Text>

                    <LegalContent type={activeTab} />

                    <View className="mt-12 pt-8 border-t border-gray-100 dark:border-zinc-800">
                        <Text className="text-xs font-satoshi-medium text-gray-400 dark:text-zinc-500 text-center">
                            Last Updated: April 15, 2026
                        </Text>
                        <Text className="text-xs font-satoshi-medium text-gray-400 dark:text-zinc-500 text-center mt-1">
                            SocioSmart v1.2.0 ��� �� 2026 SocioSmart Inc.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Legal;
