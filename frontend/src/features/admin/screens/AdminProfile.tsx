import React, { useEffect, useState } from 'react';
import { Text, ActivityIndicator, Alert, TouchableOpacity, View, ScrollView, Image, TextInput, StatusBar, Switch, Platform } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import {
  LogOut, User, Building, Bell, HelpCircle, ChevronRight, Settings, Wallet, FileText, Lock, Pencil, Globe, Moon, Check, ShieldCheck, RotateCcw, Camera
} from 'lucide-react-native';
import BottomTab from '../../../components/bottom-tab/BottomTab';
import DEFAULT_PROFILE from '../../../assets/images/default_profile.jpg';
import StatusModal, { ModalType } from '../../../components/modals/StatusModal';

import api from '../../../utils/apiConfig';

type Session = {
  token: string;
  expiresAt: number;
  role: 'admin' | 'resident' | 'guard';
  email?: string;
  full_name?: string;
  phone?: string;
  profile_image?: string;
};

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';
const LEGACY_ADMIN_SESSION_KEY = '@sociosmart/admin_session_v1';
const defaultAppSetting = {
  pushNotifications: true,
  darkMode: false,
  language: 'English',
};

// Premium Menu Option Component
const MenuOption = ({ icon: Icon, title, subtitle, color = PRIMARY_COLOR, isDestructive = false, onPress }: any) => {
  const { colorScheme } = useColorScheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      className="flex-row items-center justify-between px-5 py-4 bg-white dark:bg-zinc-900 border-b border-gray-50 dark:border-zinc-800"
    >
      <View className="flex-row items-center flex-1">
        <View className={`w-11 h-11 items-center justify-center`}>
          <Icon size={22} color={isDestructive ? '#EF4444' : (colorScheme === 'dark' ? '#2563EB' : color)} strokeWidth={2} />
        </View>
        <View className="ml-4 flex-1">
          <Text className={`font-satoshi-bold text-[15px] ${isDestructive ? 'text-red-500' : 'text-[#1E293B] dark:text-zinc-50'}`}>{title}</Text>
          {subtitle && <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-[12px] mt-0.5" numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>
      {!isDestructive && <ChevronRight size={20} color={colorScheme === 'dark' ? '#3F3F46' : '#CBD5E1'} />}
    </TouchableOpacity>
  );
};

// Premium Toggle Option Component
const ToggleOption = ({ icon: Icon, title, subtitle, value, onToggle }: any) => {
  const { colorScheme } = useColorScheme();
  return (
    <View className="flex-row items-center justify-between px-5 py-4 bg-white dark:bg-zinc-900 border-b border-gray-50 dark:border-zinc-800">
      <View className="flex-row items-center flex-1">
        <View className="w-11 h-11 items-center justify-center">
          <Icon size={22} color="#2563EB" strokeWidth={2} />
        </View>
        <View className="ml-4 flex-1">
          <Text className="font-satoshi-bold text-[15px] text-[#1E293B] dark:text-zinc-50">{title}</Text>
          {subtitle && <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-[12px] mt-0.5">{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colorScheme === 'dark' ? '#27272A' : '#E2E8F0', true: '#2563EB' }}
        thumbColor={value ? '#FFFFFF' : (colorScheme === 'dark' ? '#71717A' : '#F8FAFC')}
        ios_backgroundColor={colorScheme === 'dark' ? '#27272A' : '#E2E8F0'}
      />
    </View>
  );
};

// Premium Selection Option Component
const SelectOption = ({ icon: Icon, title, options, current, onSelect }: any) => {
  const { colorScheme } = useColorScheme();
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View className="bg-white dark:bg-zinc-900 border-b border-gray-50 dark:border-zinc-800">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShowOptions(!showOptions)}
        className="flex-row items-center justify-between px-5 py-4"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-11 h-11 items-center justify-center">
            <Icon size={22} color="#2563EB" strokeWidth={2} />
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-satoshi-bold text-[15px] text-[#1E293B] dark:text-zinc-50">{title}</Text>
            <Text className="text-primary font-satoshi-bold text-[12px] mt-0.5">{current}</Text>
          </View>
        </View>
        <ChevronRight size={18} color={colorScheme === 'dark' ? '#3F3F46' : '#CBD5E1'} style={{ transform: [{ rotate: showOptions ? '90deg' : '0deg' }] }} />
      </TouchableOpacity>

      {showOptions && (
        <View className="px-5 pb-3 bg-gray-50/10 dark:bg-zinc-800/20">
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                onSelect(opt);
                setShowOptions(false);
              }}
              className="flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-zinc-800 last:border-0"
            >
              <Text className={`font-satoshi-medium ${current === opt ? 'text-primary' : 'text-gray-600 dark:text-zinc-400'}`}>{opt}</Text>
              {current === opt && <Check size={18} color="#2563EB" strokeWidth={3} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const AdminProfile = ({ navigation }: any) => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    image: '',
    localImage: null as any
  });
  // Dedicated Edit Buffer to prevent sync conflicts
  const [editData, setEditData] = useState({ ...profileData });

  // Custom Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: ModalType;
    title: string;
    message: string;
    buttonText: string;
    secondaryText?: string;
    onAction?: () => void;
  }>({
    type: 'info',
    title: '',
    message: '',
    buttonText: 'Confirm'
  });

  const showStatusModal = (config: typeof modalConfig) => {
    setModalConfig(config);
    setModalVisible(true);
  };

  useEffect(() => {
    const load = async () => {
      // Load app settings
      const settingsRaw = await AsyncStorage.getItem('@sociosmart/app_settings_v1');
      if (settingsRaw) {
        const settings = JSON.parse(settingsRaw);
        setPushNotifications(settings.pushNotifications ?? true);
        setDarkMode(settings.darkMode ?? false);
        setLanguage(settings.language ?? 'English');
        // Initial sync of theme
        setColorScheme(settings.darkMode ? 'dark' : 'light');
      }

      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      try {
        const parsed = JSON.parse(raw) as Session;
        if (parsed?.token && parsed?.expiresAt && parsed.expiresAt > Date.now()) {
          setSession(parsed);

          // Fetch fresh data from server
          try {
            const response = await api.get('/api/auth/profile');
            if (response.status === 200) {
              const userData = response.data;
              setProfileData({
                name: userData.full_name || parsed.full_name || '',
                email: userData.email || parsed.email || '',
                phone: userData.phone || parsed.phone || '',
                image: userData.profile_image || parsed.profile_image || '',
                localImage: null
              });
              // Sync AsyncStorage if server data is different
              const updatedSession = { ...parsed, ...userData };
              await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
            } else {
              setProfileData({
                name: parsed.full_name ?? '',
                email: parsed.email ?? '',
                phone: parsed.phone ?? '',
                image: parsed.profile_image ?? '',
                localImage: null
              });
            }
          } catch (e) {
            console.log("Fetch Error:", e);
            setProfileData({
              name: parsed.full_name ?? '',
              email: parsed.email ?? '',
              phone: parsed.phone ?? '',
              image: parsed.profile_image ?? '',
              localImage: null
            });
          }
          return;
        }
      } catch { }

      await AsyncStorage.multiRemove([SESSION_KEY, LEGACY_ADMIN_SESSION_KEY]);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    load()
      .catch(async () => {
        await AsyncStorage.multiRemove([SESSION_KEY, LEGACY_ADMIN_SESSION_KEY]);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      })
      .finally(() => setIsLoading(false));
  }, [navigation]);

  const pickImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 500,
        height: 500,
        cropping: true,
        mediaType: 'photo',
        includeBase64: false,
      });

      setEditData(prev => ({ ...prev, localImage: image }));
    } catch (error) {
      if ((error as any).code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Failed to pick image');
      }
    }
  };

  const onLogout = () => {
    showStatusModal({
      type: 'error',
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your account?',
      buttonText: 'Sign Out',
      secondaryText: 'Cancel',
      onAction: async () => {
        setModalVisible(false);
        await AsyncStorage.multiRemove([SESSION_KEY, LEGACY_ADMIN_SESSION_KEY]);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 items-center justify-center">
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#FFFFFF"} />
        <View style={{ flex: 1, minHeight: 400, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveProfile = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append('full_name', editData.name);
      formData.append('email', editData.email);
      formData.append('phone', editData.phone);

      if (editData.localImage) {
        const image = editData.localImage;
        const uri = Platform.OS === 'android' ? image.path : image.path.replace('file://', '');
        formData.append('profile_image', {
          uri,
          name: `profile_${Date.now()}.jpg`,
          type: image.mime || 'image/jpeg',
        } as any);
      }

      const response = await api.patch('/api/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
        const result = response.data;
        const updatedUser = result.user;
        const updatedSession = {
          ...session,
          full_name: updatedUser.full_name,
          phone: updatedUser.phone,
          profile_image: updatedUser.profile_image
        };

        setSession(updatedSession);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));

        const finalProfile = {
          name: updatedUser.full_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          image: updatedUser.profile_image,
          localImage: null
        };

        setProfileData(finalProfile);
        setEditData(finalProfile);

        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error("Save Profile Error:", error);
      Alert.alert('Error', error.response?.data?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotification = async (value: boolean) => {
    try {
      setPushNotifications(value);
      await saveAppSetting('pushNotifications', value);
    } catch (e) {
      console.log("Error saving notification settings:", e);
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    try {
      setDarkMode(value);
      setColorScheme(value ? 'dark' : 'light');
      await saveAppSetting('darkMode', value);
    } catch (e) {
      console.log("Error saving dark mode setting:", e);
    }
  };

  const handleSelectLanguage = async (value: string) => {
    try {
      setLanguage(value);
      await saveAppSetting('language', value);
    } catch (e) {
      console.log("Error saving language setting:", e);
    }
  };

  const resetSettings = () => {
    const defaultAppSetting = {
      pushNotifications: true,
      darkMode: false,
      language: 'English',
    };

    showStatusModal({
      type: 'warning',
      title: 'Reset Settings',
      message: 'Are you sure you want to restore default application settings?',
      buttonText: 'Reset',
      secondaryText: 'Cancel',
      onAction: async () => {
        setModalVisible(false);
        setPushNotifications(true);
        setDarkMode(false);
        setLanguage('English');
        setColorScheme('light');
        await AsyncStorage.setItem('@sociosmart/app_settings_v1', JSON.stringify(defaultAppSetting));
      }
    });
  };

  const saveAppSetting = async (key: string, value: any) => {
    const settingsRaw = await AsyncStorage.getItem('@sociosmart/app_settings_v1');
    let settings = settingsRaw ? JSON.parse(settingsRaw) : {};
    settings[key] = value;
    await AsyncStorage.setItem('@sociosmart/app_settings_v1', JSON.stringify(settings));
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-zinc-950" edges={['top']}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
      {/* Header */}
      <View className="px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">My Account</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* User Card */}
        {!isEditing ? (
          <View className="mx-3 mt-2 mb-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-zinc-800">
            <View className="flex-row items-center">
              <Image
                source={(profileData.image && !profileData.image.includes('default_avatar.png')) ? { uri: profileData.image } : DEFAULT_PROFILE}
                className="w-16 h-16 rounded-full border border-gray-100 dark:border-zinc-800"
                resizeMode="cover"
              />
              <View className="ml-4 flex-1">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[18px]" numberOfLines={1}>{profileData.name}</Text>
                <Text className="text-gray-500 dark:text-zinc-400 text-[13px] font-satoshi-medium mt-1" numberOfLines={1}>{profileData.email}</Text>
                <Text className="text-gray-500 dark:text-zinc-400 text-[13px] font-satoshi-medium mt-0.5" numberOfLines={1}>{profileData.phone}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditData({ ...profileData });
                  setIsEditing(true);
                }}
                className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 items-center justify-center ml-2"
              >
                <Pencil size={18} color={colorScheme === 'dark' ? '#60A5FA' : "#2563EB"} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="mx-3 mt-2 mb-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-5 border border-blue-100 dark:border-blue-900/40">
            <View className="flex-row items-center mb-5">
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <View className="relative">
                  <Image
                    source={editData.localImage?.path ? { uri: editData.localImage.path } : ((editData.image && !editData.image.includes('default_avatar.png')) ? { uri: editData.image } : DEFAULT_PROFILE)}
                    className="w-14 h-14 rounded-full border border-gray-100 dark:border-zinc-800"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-0 right-0 bg-primary w-5 h-5 rounded-full items-center justify-center border-2 border-white dark:border-zinc-900">
                    <Camera size={10} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
              <View className="ml-4 flex-1">
                <Text className="font-satoshi-bold text-[#2563EB] dark:text-blue-400 text-[16px]">Edit Profile</Text>
                <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-[12px]">Update your public information</Text>
              </View>
            </View>

            <View className="mb-5">
              <TextInput
                value={editData.name}
                onChangeText={(t) => setEditData({ ...editData, name: t })}
                className="bg-gray-50 dark:bg-zinc-800/50 font-satoshi-medium text-gray-900 dark:text-zinc-50 px-4 py-3 rounded-xl border border-gray-100 dark:border-zinc-800 mb-3"
                placeholder="Full Name"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
              />
              <TextInput
                value={editData.email}
                onChangeText={(t) => setEditData({ ...editData, email: t })}
                className="bg-gray-50 dark:bg-zinc-800/50 font-satoshi-medium text-gray-900 dark:text-zinc-50 px-4 py-3 rounded-xl border border-gray-100 dark:border-zinc-800 mb-3"
                placeholder="Email Address"
                keyboardType="email-address"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
              />
              <TextInput
                value={editData.phone}
                onChangeText={(t) => setEditData({ ...editData, phone: t })}
                className="bg-gray-50 dark:bg-zinc-800/50 font-satoshi-medium text-gray-900 dark:text-zinc-50 px-4 py-3 rounded-xl border border-gray-100 dark:border-zinc-800"
                placeholder="Admin Phone Number"
                keyboardType="phone-pad"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
              />
            </View>

            <View className="flex-row justify-end space-x-3 gap-x-3">
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800"
              >
                <Text className="text-gray-600 dark:text-zinc-400 font-satoshi-bold text-[14px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB]"
              >
                <Text className="text-white font-satoshi-bold text-[14px]">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Preferences */}
        <View className="mx-3 mb-4 overflow-hidden rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <View className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <Text className="text-gray-500 dark:text-zinc-500 font-satoshi-bold text-[12px] uppercase tracking-wider">Preferences</Text>
          </View>
          <SelectOption
            icon={Globe}
            title="App Language"
            options={['English', 'Urdu']}
            current={language}
            onSelect={handleSelectLanguage}
          />
          <ToggleOption
            icon={Moon}
            title="Dark Mode"
            subtitle="Switch theme variant"
            value={darkMode}
            onToggle={handleToggleDarkMode}
          />
          <ToggleOption
            icon={Bell}
            title="Push Notifications"
            subtitle="Receive real-time app alerts"
            value={pushNotifications}
            onToggle={handleToggleNotification}
          />
        </View>

        {/* More */}
        <View className="mx-3 mb-4 overflow-hidden rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <View className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <Text className="text-gray-500 dark:text-zinc-500 font-satoshi-bold text-[12px] uppercase tracking-wider">More</Text>
          </View>
          <MenuOption icon={FileText} title="Legal" subtitle="Terms of service & privacy policy" onPress={() => navigation.navigate('Legal')} />
          <MenuOption
            icon={RotateCcw}
            title="Reset to Defaults"
            subtitle="Restore factory application settings"
            color="#2563EB"
            onPress={resetSettings}
          />
          <MenuOption icon={LogOut} title="Sign Out" isDestructive={true} onPress={onLogout} />
        </View>
      </ScrollView>

      <BottomTab activeTab="profile" navigation={navigation} />

      <StatusModal
        visible={modalVisible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.buttonText}
        onClose={modalConfig.onAction || (() => setModalVisible(false))}
        secondaryButtonText={modalConfig.secondaryText}
        onSecondaryPress={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default AdminProfile;
