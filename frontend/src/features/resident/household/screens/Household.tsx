import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Modal, TextInput, Platform, NativeModules } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Users,
    Car,
    Heart,
    Plus,
    ChevronRight,
    ShieldCheck,
    CheckCircle2,
    X,
    ArrowLeft
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../../../../utils/apiConfig';
import FamilyManagement from '../../profile/components/FamilyManagement';
import VehicleManagement from '../../profile/components/VehicleManagement';
import PetManagement from '../../profile/components/PetManagement';

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';

const MemberCard = ({ icon: Icon, title, subtitle, count, color, onPress }: any) => {
    const { colorScheme } = useColorScheme();
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            className="flex-row items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-[28px] border border-gray-100 dark:border-zinc-800 mb-4 shadow-sm"
        >
            <View className="flex-row items-center flex-1">
                <View
                    className="w-12 h-12 rounded-2xl items-center justify-center border"
                    style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
                >
                    <Icon size={24} color={color} />
                </View>
                <View className="ml-4 flex-1">
                    <Text className="font-satoshi-bold text-base text-gray-900 dark:text-zinc-50">{title}</Text>
                    <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-xs mt-0.5">{subtitle}</Text>
                </View>
            </View>
            <View className="flex-row items-center">
                <View className="bg-gray-50 dark:bg-zinc-800 px-3 py-1 rounded-full mr-3">
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-xs">{count}</Text>
                </View>
                <ChevronRight size={18} color={colorScheme === 'dark' ? '#3F3F46' : "#CBD5E1"} />
            </View>
        </TouchableOpacity>
    );
};

const Household = ({ navigation }: any) => {
    const { colorScheme } = useColorScheme();
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [activeSection, setActiveSection] = useState<'family' | 'vehicles' | 'pets'>('family');
    const [isManagingAssets, setIsManagingAssets] = useState(false);
    const [profileData, setProfileData] = useState({
        family_members: [] as any[],
        vehicles: [] as any[],
        pets: [] as any[]
    });

    useEffect(() => {
        const loadSession = async () => {
            try {
                const raw = await AsyncStorage.getItem(SESSION_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    setSession(parsed);
                    setProfileData({
                        family_members: parsed.family_members || [],
                        vehicles: parsed.vehicles || [],
                        pets: parsed.pets || []
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
    }, []);

    const handleSaveAssets = async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const baseUrl = getApiBaseUrl();

            const formData = new FormData();
            // In Household screen, we only care about assets, but we must send identifying info or at least the arrays
            formData.append('full_name', session.full_name); // Perserve name
            formData.append('family_members', JSON.stringify(profileData.family_members));
            formData.append('vehicles', JSON.stringify(profileData.vehicles));
            formData.append('pets', JSON.stringify(profileData.pets));

            const response = await fetch(`${baseUrl}/api/auth/profile`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${session.token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                const updatedData = result.user;
                const updatedSession = { ...session, ...updatedData };
                await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
                setSession(updatedSession);
                setProfileData({
                    family_members: updatedData.family_members || [],
                    vehicles: updatedData.vehicles || [],
                    pets: updatedData.pets || []
                });
                Alert.alert("Success", "Household assets updated successfully.");
            } else {
                const err = await response.json();
                Alert.alert("Error", err.message || "Failed to update assets.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Server connection failed.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 items-center justify-center">
                <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                </View>
            </SafeAreaView>
        );
    }

    const family = session?.family_members || [];
    const vehicles = session?.vehicles || [];
    const pets = session?.pets || [];

    return (
        <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />

            {/* Header */}
            <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 items-center justify-center mr-4"
                >
                    <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
                </TouchableOpacity>
                <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">My Household</Text>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Sub-Tabs Selector */}
                <View className="flex-row bg-white dark:bg-zinc-900 p-1.5 rounded-3xl border border-gray-100 dark:border-zinc-800 mb-6 shadow-sm">
                    <TouchableOpacity
                        onPress={() => setActiveSection('family')}
                        className={`flex-1 py-3 items-center rounded-full ${activeSection === 'family' ? 'bg-blue-600' : ''}`}
                    >
                        <Text className={`text-[12px] font-satoshi-bold ${activeSection === 'family' ? 'text-white' : 'text-gray-400 dark:text-zinc-500'}`}>Family ({family.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveSection('vehicles')}
                        className={`flex-1 py-3 items-center rounded-full ${activeSection === 'vehicles' ? 'bg-blue-600' : ''}`}
                    >
                        <Text className={`text-[12px] font-satoshi-bold ${activeSection === 'vehicles' ? 'text-white' : 'text-gray-400 dark:text-zinc-500'}`}>Vehicles ({vehicles.length})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveSection('pets')}
                        className={`flex-1 py-3 items-center rounded-full ${activeSection === 'pets' ? 'bg-blue-600' : ''}`}
                    >
                        <Text className={`text-[12px] font-satoshi-bold ${activeSection === 'pets' ? 'text-white' : 'text-gray-400 dark:text-zinc-500'}`}>Pets ({pets.length})</Text>
                    </TouchableOpacity>
                </View>

                {/* Content Area */}
                <View>
                    {activeSection === 'family' && (
                        <View>
                            {family.length === 0 ? (
                                <EmptyState icon={Users} title="No Family Members" subtitle="Add your family members from your profile to keep them synced with security." />
                            ) : (
                                family.map((m: any, i: number) => (
                                    <DetailCard key={i} title={m.name} subtitle={m.relation} icon={Users} color="#2563EB" />
                                ))
                            )}
                        </View>
                    )}

                    {activeSection === 'vehicles' && (
                        <View>
                            {vehicles.length === 0 ? (
                                <EmptyState icon={Car} title="No Vehicles" subtitle="Register your vehicles to enable seamless gate access and parking." />
                            ) : (
                                vehicles.map((v: any, i: number) => (
                                    <DetailCard
                                        key={i}
                                        title={v.vehicle_no || v.vehicle_number}
                                        subtitle={v.model || v.make_model}
                                        icon={Car}
                                        color="#8B5CF6"
                                        status={v.approval_status || 'approved'}
                                    />
                                ))
                            )}
                            <TouchableOpacity
                                onPress={() => navigation.navigate('VehicleRegistry')}
                                className="mt-2 items-center"
                            >
                                <Text className="text-blue-600 font-satoshi-bold text-xs underline">Go to Full Registry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeSection === 'pets' && (
                        <View>
                            {pets.length === 0 ? (
                                <EmptyState icon={Heart} title="No Pets" subtitle="Add your lovely pets to the society registry for safety and coordination." />
                            ) : (
                                pets.map((p: any, i: number) => (
                                    <DetailCard key={i} title={p.name} subtitle={p.type} icon={Heart} color="#F43F5E" />
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Asset Management Modal */}
            <Modal
                visible={isManagingAssets}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsManagingAssets(false)}
            >
                <View className="flex-1 bg-black/40 justify-end">
                    <View className="bg-offWhite dark:bg-zinc-950 rounded-t-[40px] h-[85%] p-6">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-xl font-satoshi-bold text-gray-900 dark:text-zinc-50">Manage Household Assets</Text>
                            <TouchableOpacity
                                onPress={() => setIsManagingAssets(false)}
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-900 items-center justify-center"
                            >
                                <X size={20} color={colorScheme === 'dark' ? '#F4F4F5' : "#111827"} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                            <FamilyManagement
                                familyMembers={profileData.family_members}
                                onUpdate={(next) => setProfileData({ ...profileData, family_members: next })}
                                colorScheme={colorScheme}
                            />

                            <VehicleManagement
                                vehicles={profileData.vehicles}
                                onUpdate={(next) => setProfileData({ ...profileData, vehicles: next })}
                                colorScheme={colorScheme}
                            />

                            <PetManagement
                                pets={profileData.pets}
                                onUpdate={(next) => setProfileData({ ...profileData, pets: next })}
                                colorScheme={colorScheme}
                            />

                            <TouchableOpacity
                                onPress={async () => {
                                    await handleSaveAssets();
                                    setIsManagingAssets(false);
                                }}
                                className="mt-4 bg-blue-600 py-4 rounded-full items-center shadow-lg shadow-blue-500/30"
                            >
                                <Text className="text-white font-satoshi-bold text-base">Save Changes</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            <TouchableOpacity
                onPress={() => setIsManagingAssets(true)}
                style={{ position: 'absolute', bottom: 30, right: 30, elevation: 10, zIndex: 999 }}
                activeOpacity={0.8}
                className="w-16 h-16 bg-[#2563EB] rounded-full items-center justify-center shadow-2xl shadow-blue-600/50"
            >
                <Plus size={32} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const DetailCard = ({ title, subtitle, icon: Icon, color, status }: any) => {
    const isApproved = !status || status === 'approved';
    const isPending = status === 'pending';
    const isRejected = status === 'rejected';

    return (
        <View className="flex-row items-center p-5 bg-white dark:bg-zinc-900 rounded-[28px] border border-gray-100 dark:border-zinc-800 mb-4 shadow-sm">
            <View
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{ backgroundColor: `${color}15` }}
            >
                <Icon size={22} color={color} />
            </View>
            <View className="ml-4 flex-1">
                <Text className="font-satoshi-bold text-[15px] text-gray-900 dark:text-zinc-50">{title}</Text>
                <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-[12px] mt-0.5">{subtitle}</Text>
            </View>
            <View className={`px-2 py-1 rounded-lg ${isApproved ? 'bg-green-50 dark:bg-green-900/20' : isPending ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                <Text className={`font-satoshi-bold text-[10px] ${isApproved ? 'text-green-600 dark:text-green-400' : isPending ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {(status || 'APPROVED').toUpperCase()}
                </Text>
            </View>
        </View>
    );
};

const EmptyState = ({ icon: Icon, title, subtitle }: any) => {
    return (
        <View className="items-center justify-center py-12 px-8 bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 border-dashed">
            <View className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-full items-center justify-center mb-4">
                <Icon size={32} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base text-center">{title}</Text>
            <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-xs text-center mt-2 leading-relaxed">{subtitle}</Text>
        </View>
    );
};

export default Household;
