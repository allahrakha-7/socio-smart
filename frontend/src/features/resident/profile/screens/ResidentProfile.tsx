import React, { useEffect, useState } from 'react';
import { Text, ActivityIndicator, Alert, TouchableOpacity, View, ScrollView, Image, TextInput, StatusBar, Platform, NativeModules, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import {
  LogOut, Users, Car, Bell, HelpCircle, ChevronRight, Settings, Wallet, FileText, Lock, Pencil, PawPrint, AlertOctagon, Globe, Moon, Check, RotateCcw
} from 'lucide-react-native';
import BottomTab from '../../../../components/bottom-tab/BottomTab';
import DEFAULT_PROFILE from '../../../../assets/images/default_profile.jpg';
import ImagePicker from 'react-native-image-crop-picker';
import { getApiBaseUrl } from '../../../../utils/apiConfig';

type Session = {
  token: string;
  expiresAt: number;
  role: 'admin' | 'resident' | 'guard';
  email?: string;
  full_name?: string;
  phone?: string;
  house_number?: string;
  bio?: string;
  blood_group?: string;
  emergency_contact?: string;
  family_members?: { name: string; relation: string }[];
  vehicles?: { vehicle_no: string; model: string }[];
  pets?: { name: string; type: string }[];
  profile_image?: string;
  _id?: string;
};

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';
const LEGACY_ADMIN_SESSION_KEY = '@sociosmart/admin_session_v1';

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
        <View className="w-11 h-11 items-center justify-center">
          <Icon size={22} color={isDestructive ? '#EF4444' : (colorScheme === 'dark' ? '#60A5FA' : color)} strokeWidth={2} />
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

const ResidentProfile = ({ navigation }: any) => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // App Settings State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    house_number: '',
    bio: '',
    blood_group: '',
    emergency_contact: '',
    family_members: [] as any[],
    vehicles: [] as any[],
    pets: [] as any[],
    profile_image: ''
  });
  const [selectedImage, setSelectedImage] = useState<any>(null);

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
          setProfileData({
            name: parsed.full_name ?? 'Resident User',
            email: parsed.email ?? 'resident@sociosmart.com',
            phone: parsed.phone ?? '+1 (555) 555-0123',
            house_number: parsed.house_number ?? 'B-201',
            bio: parsed.bio ?? '',
            blood_group: parsed.blood_group ?? '',
            emergency_contact: parsed.emergency_contact ?? '',
            family_members: parsed.family_members ?? [],
            vehicles: parsed.vehicles ?? [],
            pets: parsed.pets ?? [],
            profile_image: parsed.profile_image ?? 'https://res.cloudinary.com/dku9p6pzn/image/upload/v1713210000/default_avatar.png'
          });
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

  const onLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove([SESSION_KEY, LEGACY_ADMIN_SESSION_KEY]);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const handlePickImage = () => {
    ImagePicker.openPicker({
      width: 500,
      height: 500,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.8,
    }).then(image => {
      setSelectedImage(image);
    }).catch(err => {
      if (err.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Could not pick image');
      }
    });
  };

  const handleSaveProfile = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();

      const formData = new FormData();
      formData.append('full_name', profileData.name);
      formData.append('phone', profileData.phone);
      formData.append('house_number', profileData.house_number);
      formData.append('bio', profileData.bio);
      formData.append('blood_group', profileData.blood_group);
      formData.append('emergency_contact', profileData.emergency_contact);
      formData.append('family_members', JSON.stringify(profileData.family_members));
      formData.append('vehicles', JSON.stringify(profileData.vehicles));
      formData.append('pets', JSON.stringify(profileData.pets));

      if (selectedImage) {
        formData.append('profile_image', {
          uri: selectedImage.path,
          type: selectedImage.mime,
          name: `profile_${session?._id}.jpg`,
        });
      }

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

        // Merge current session with updated user data
        const updatedSession = {
          ...session,
          ...updatedData
        };

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
        setSession(updatedSession);
        setProfileData({
          name: updatedData.full_name,
          email: updatedData.email,
          phone: updatedData.phone,
          house_number: updatedData.house_number,
          bio: updatedData.bio,
          blood_group: updatedData.blood_group,
          emergency_contact: updatedData.emergency_contact,
          family_members: updatedData.family_members || [],
          vehicles: updatedData.vehicles || [],
          pets: updatedData.pets || [],
          profile_image: updatedData.profile_image
        });
        setSelectedImage(null);
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully.");
      } else {
        const err = await response.json();
        Alert.alert("Update Failed", err.message || "Could not update profile.");
      }
    } catch (error) {
      console.error("Update Profile Error:", error);
      Alert.alert("Error", "Unable to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerPanicAlert = async () => {
    Alert.alert(
      "Emergency SOS",
      "This will immediately dispatch an alert to Society Security and Admins. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dispatch SOS",
          style: "destructive",
          onPress: async () => {
            if (!session?.token) return;
            try {
              const baseUrl = getApiBaseUrl(); // Assuming same resolver logic
              const response = await fetch(`${baseUrl}/api/alerts/sos`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.token}`,
                  'Content-Type': 'application/json'
                }
              });
              if (response.ok) {
                Alert.alert("SOS Dispatched", "Security has been notified.");
              }
            } catch (error) {
              console.log(error);
            }
          }
        }
      ]
    );
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

    Alert.alert(
      "Reset Settings",
      "Are you sure you want to restore default application settings?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setPushNotifications(true);
            setDarkMode(false);
            setLanguage('English');
            setColorScheme('light');
            await AsyncStorage.setItem('@sociosmart/app_settings_v1', JSON.stringify(defaultAppSetting));
          }
        }
      ]
    );
  };

  const saveAppSetting = async (key: string, value: any) => {
    const settingsRaw = await AsyncStorage.getItem('@sociosmart/app_settings_v1');
    let settings = settingsRaw ? JSON.parse(settingsRaw) : {};
    settings[key] = value;
    await AsyncStorage.setItem('@sociosmart/app_settings_v1', JSON.stringify(settings));
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
          <View className="mx-6 mt-2 mb-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-zinc-800">
            <View className="flex-row items-center">
              <View className="relative">
                <Image
                  source={profileData.profile_image && !profileData.profile_image.includes('default_avatar.png') ? { uri: profileData.profile_image } : DEFAULT_PROFILE}
                  className="w-20 h-20 rounded-full border-2 border-gray-100 dark:border-zinc-800"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900 items-center justify-center">
                  <View className="w-2 h-2 bg-white rounded-full" />
                </View>
              </View>
              <View className="ml-5 flex-1">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[20px]" numberOfLines={1}>{profileData.name}</Text>
                <View className="flex-row items-center mt-1.5">
                  <View className="bg-blue-600 px-2 py-1 rounded-lg mr-2.5">
                    <Text className="text-white text-[10px] font-satoshi-black uppercase">Unit {profileData.house_number}</Text>
                  </View>
                </View>
                <Text className="text-gray-400 dark:text-zinc-500 text-base font-satoshi-medium mt-1" numberOfLines={1}>{profileData.email}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="w-10 h-10 items-center justify-center ml-2 mt-2"
              >
                <Pencil size={18} color={colorScheme === 'dark' ? '#2563EB' : "#2563EB"} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="mx-6 mt-2 mb-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-5 border border-blue-100 dark:border-blue-900/40">
            <View className="flex-row items-center mb-5">
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} className="relative">
                <Image
                  source={selectedImage ? { uri: selectedImage.path } : (profileData.profile_image && !profileData.profile_image.includes('default_avatar.png') ? { uri: profileData.profile_image } : DEFAULT_PROFILE)}
                  className="w-16 h-16 rounded-full border-2 border-blue-100 dark:border-blue-900/40"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 border-2 border-white dark:border-zinc-900">
                  <Pencil size={10} color="white" />
                </View>
              </TouchableOpacity>
              <View className="ml-4 flex-1">
                <Text className="font-satoshi-bold text-[#2563EB] dark:text-blue-400 text-[18px]">Edit Profile</Text>
                <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-[12px] mt-0.5">Update your personal identity</Text>
              </View>
            </View>

            <View className="mb-5">
              <Text className="text-xs font-satoshi-bold text-gray-400 dark:text-zinc-500 mb-2 uppercase ml-1">Basic Info</Text>
              <TextInput
                value={profileData.name}
                onChangeText={(t) => setProfileData({ ...profileData, name: t })}
                className="bg-gray-50 dark:bg-zinc-800/50 font-satoshi-medium text-gray-900 dark:text-zinc-50 px-4 py-3 rounded-xl border border-gray-100 dark:border-zinc-800 mb-3 text-sm"
                placeholder="Full Name"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
              />
              <TextInput
                value={profileData.phone}
                onChangeText={(t) => setProfileData({ ...profileData, phone: t })}
                className="bg-gray-50 dark:bg-zinc-800/50 font-satoshi-medium text-gray-900 dark:text-zinc-50 px-4 py-3 rounded-xl border border-gray-100 dark:border-zinc-800 mb-3 text-sm"
                placeholder="Phone Number"
                keyboardType="phone-pad"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
              />
              <TextInput
                value={profileData.house_number}
                onChangeText={(t) => setProfileData({ ...profileData, house_number: t })}
                className="bg-gray-50 dark:bg-zinc-800/50 font-satoshi-medium text-gray-900 dark:text-zinc-50 px-4 py-3 rounded-xl border border-gray-100 dark:border-zinc-800 mb-3 text-sm"
                placeholder="Unit Number (e.g. B-201)"
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
              />

              <Text className="text-xs font-satoshi-bold text-gray-400 dark:text-zinc-500 mb-2 mt-2 uppercase ml-1">Additional Details</Text>
              <TextInput
                value={profileData.bio}
                onChangeText={(t) => setProfileData({ ...profileData, bio: t })}
                className="bg-gray-50 dark:bg-zinc-800/50 font-satoshi-medium text-gray-900 dark:text-zinc-50 px-4 py-3 rounded-xl border border-gray-100 dark:border-zinc-800 mb-3 text-sm"
                placeholder="Bio (Short description about yourself)"
                multiline
                numberOfLines={2}
                placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
              />
              <View className="flex-row">
                <TextInput
                  value={profileData.blood_group}
                  onChangeText={(t) => setProfileData({ ...profileData, blood_group: t })}
                  className="flex-1 bg-gray-50 dark:bg-zinc-800/50 font-satoshi-medium text-gray-900 dark:text-zinc-50 px-3 py-3 rounded-xl border border-gray-100 dark:border-zinc-800 mr-3 mb-3 text-sm"
                  placeholder="Blood Group"
                  autoCapitalize="characters"
                  maxLength={3}
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                />
                <TextInput
                  value={profileData.emergency_contact}
                  onChangeText={(t) => setProfileData({ ...profileData, emergency_contact: t })}
                  className="flex-[2] bg-gray-50 dark:bg-zinc-800/50 font-satoshi-medium text-gray-900 dark:text-zinc-50 px-4 py-3 rounded-xl border border-gray-100 dark:border-zinc-800 mb-3 text-sm"
                  placeholder="Emergency Contact"
                  keyboardType="phone-pad"
                  placeholderTextColor={colorScheme === 'dark' ? '#71717A' : '#A1A1AA'}
                />
              </View>

              {/* Assets removed from here as per request */}

            </View>

            <View className="flex-row justify-end gap-x-3">
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


        {/* Identity & Health Section */}
        {!isEditing && (
          <View className="mx-6 mb-6 overflow-hidden rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
            <View className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex-row justify-between items-center">
              <Text className="text-gray-500 dark:text-zinc-500 font-satoshi-bold text-[12px] uppercase tracking-wider">Profile Details</Text>
            </View>

            <View className="p-5">
              <View className="mb-4">
                <Text className="text-gray-400 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase tracking-widest mb-1.5">Personal Biography</Text>
                <Text className="text-gray-700 dark:text-zinc-300 font-satoshi-medium text-[14px] leading-snug">
                  {profileData.bio || "No professional biography added yet."}
                </Text>
              </View>

              <View className="flex-row items-center border-t border-gray-50 dark:border-zinc-800 pt-4">
                <View className="flex-1">
                  <Text className="text-gray-400 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase tracking-widest mb-1">Blood Group</Text>
                  <Text className="text-red-500 font-satoshi-black text-[16px]">{profileData.blood_group || "N/A"}</Text>
                </View>
                <View className="flex-[2] border-l border-gray-50 dark:border-zinc-800 pl-4">
                  <Text className="text-gray-400 dark:text-zinc-500 text-[10px] font-satoshi-bold uppercase tracking-widest mb-1">Emergency Contact</Text>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[16px]">{profileData.emergency_contact || "Not Configured"}</Text>
                </View>
              </View>
            </View>
          </View>
        )}


        <View className="mx-6 mb-6 overflow-hidden rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <View className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <Text className="text-gray-500 dark:text-zinc-500 font-satoshi-bold text-[12px] uppercase tracking-wider">Household & Finance</Text>
          </View>
          <MenuOption icon={Users} title="Family Members" subtitle="Manage members of your flat" onPress={() => navigation.navigate('Household')} />
          <MenuOption icon={Wallet} title="Maintenance Dues" subtitle="Pay and view history" onPress={() => navigation.navigate('Payments')} />
        </View>

        {/* Preferences */}
        <View className="mx-6 mb-6 overflow-hidden rounded-[24px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
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
        <View className="mx-6 mb-6 overflow-hidden rounded-lg bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <View className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <Text className="text-gray-500 dark:text-zinc-500 font-satoshi-bold text-[12px] uppercase tracking-wider">More</Text>
          </View>
          <MenuOption icon={HelpCircle} title="Help & Support" subtitle="Get assistance or read guides" onPress={() => navigation.navigate('Support')} />
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

    </SafeAreaView>
  );
};

export default ResidentProfile;
