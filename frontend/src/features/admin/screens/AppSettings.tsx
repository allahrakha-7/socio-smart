import React, { useEffect, useState } from 'react';
import {
  Text,
  Switch,
  Alert,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import {
  ArrowLeft,
  RotateCcw,
  Check,
  ChevronRight,
  Globe,
  Moon,
  Bell,
  ShieldCheck
} from 'lucide-react-native';

const PRIMARY_COLOR = '#2563EB';
const SETTINGS_KEY = '@sociosmart/app_settings_v1';

type AppSettingsType = {
  pushNotifications: boolean;
  theme: 'Light' | 'Dark' | 'System';
  language: 'English' | 'Urdu';
};

const defaultSettings: AppSettingsType = {
  pushNotifications: true,
  theme: 'System',
  language: 'English',
};

// Premium Toggle Component
const SettingToggle = ({ icon: Icon, title, subtitle, value, onToggle }: any) => {
  const { colorScheme } = useColorScheme();
  return (
    <View className="flex-row items-center justify-between px-5 py-4 bg-white dark:bg-zinc-900 border-b border-gray-50 dark:border-zinc-800">
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 items-center justify-center">
          <Icon size={20} color={PRIMARY_COLOR} strokeWidth={2} />
        </View>
        <View className="ml-4 flex-1">
          <Text className="font-satoshi-bold text-[15px] text-[#1E293B] dark:text-zinc-50">{title}</Text>
          {subtitle && <Text className="text-gray-400 dark:text-zinc-400 font-satoshi-medium text-[12px] mt-0.5" numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colorScheme === 'dark' ? '#27272A' : '#E2E8F0', true: '#60A5FA' }}
        thumbColor={value ? '#FFFFFF' : (colorScheme === 'dark' ? '#71717A' : '#F8FAFC')}
        ios_backgroundColor={colorScheme === 'dark' ? '#27272A' : '#E2E8F0'}
      />
    </View>
  );
};

// Premium Selection Component
const SettingSelect = ({ icon: Icon, title, options, current, onSelect }: any) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View className="bg-white dark:bg-zinc-900 border-b border-gray-50 dark:border-zinc-800">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShowOptions(!showOptions)}
        className="flex-row items-center justify-between px-5 py-4"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 items-center justify-center">
            <Icon size={20} color={PRIMARY_COLOR} strokeWidth={2} />
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-satoshi-bold text-[15px] text-[#1E293B] dark:text-zinc-50">{title}</Text>
            <Text className="text-primary font-satoshi-bold text-[12px] mt-0.5">{current}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {showOptions && (
        <View className="px-5 py-2 bg-gray-50/50 dark:bg-zinc-800/40">
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                onSelect(opt);
                setShowOptions(false);
              }}
              className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0"
            >
              <Text className={`font-satoshi-medium ${current === opt ? 'text-primary' : 'text-gray-600 dark:text-zinc-400'}`}>{opt}</Text>
              {current === opt && <Check size={18} color={PRIMARY_COLOR} strokeWidth={3} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const AppSettings = ({ navigation }: any) => {
  const [settings, setSettings] = useState<AppSettingsType>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings(parsed);
          
          if (parsed.theme === 'System' || !parsed.theme) {
            setColorScheme('system');
          } else {
            setColorScheme(parsed.theme === 'Dark' ? 'dark' : 'light');
          }
        } else {
          setColorScheme('system');
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [setColorScheme]);

  const saveSettings = async (newSettings: AppSettingsType) => {
    try {
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      
      if (newSettings.theme === 'System') {
        setColorScheme('system');
      } else {
        setColorScheme(newSettings.theme === 'Dark' ? 'dark' : 'light');
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save your preferences.");
    }
  };

  const handleToggle = async (key: keyof AppSettingsType) => {
    const updated = { ...settings, [key]: !settings[key] };
    saveSettings(updated);
  };

  const handleSelect = (key: keyof AppSettingsType, value: any) => {
    const updated = { ...settings, [key]: value };
    saveSettings(updated);
  };

  const resetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to restore default application settings?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => saveSettings(defaultSettings) }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 items-center justify-center">
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#F8FAFC"} />
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
      <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center mr-4"
        >
          <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
        </TouchableOpacity>
        <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">App Settings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* General Preferences */}
        <View className="mt-6 mx-5 overflow-hidden rounded-[24px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <View className="px-5 py-4 border-b border-gray-50 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
            <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-bold text-[11px] uppercase tracking-wider">General Preferences</Text>
          </View>
          
          <SettingSelect 
            icon={Globe} 
            title="App Language" 
            options={['English', 'Urdu']}
            current={settings.language}
            onSelect={(val: any) => handleSelect('language', val)}
          />
          
          <SettingSelect 
            icon={Moon} 
            title="App Theme" 
            options={['Light', 'Dark', 'System']}
            current={settings.theme || 'System'}
            onSelect={(val: any) => handleSelect('theme', val)}
          />
          
          <SettingToggle 
            icon={Bell} 
            title="Push Notifications" 
            subtitle="Real-time society alerts"
            value={settings.pushNotifications}
            onToggle={() => handleToggle('pushNotifications')}
          />
        </View>


        {/* Maintenance */}
        <View className="mt-6 mx-5 overflow-hidden rounded-[24px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={resetSettings}
            className="flex-row items-center justify-between px-5 py-5"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center">
                <RotateCcw size={20} color="#EF4444" strokeWidth={2} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="font-satoshi-bold text-[15px] text-red-500">Restore Defaults</Text>
                <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-[11px] mt-0.5">Reset all application preferences</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View className="mt-10 items-center px-10">
          <Text className="text-gray-400 dark:text-zinc-600 font-satoshi-medium text-[11px] text-center">
            SocioSmart v1.2.0 ��� Build 42
          </Text>
          <Text className="text-gray-300 dark:text-zinc-700 font-satoshi-medium text-[10px] text-center mt-1">
            Application settings are synchronized across devices linked to your society account.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default AppSettings;
