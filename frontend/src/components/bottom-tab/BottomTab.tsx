import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Home,
  MessagesSquare,
  User,
  LayoutGrid
} from 'lucide-react-native';

import { useColorScheme } from 'nativewind';
const BottomTab = ({ activeTab, navigation }: any) => {
  const [role, setRole] = useState<'admin' | 'resident' | 'guard'>('resident');
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem('@sociosmart/session_v1').then((res) => {
      if (res) {
        try {
          const parsed = JSON.parse(res);
          if (parsed.role) setRole(parsed.role);
        } catch { }
      }
    });
  }, []);

  const handleNavigation = (tabName: string, screenName: string) => {
    if (activeTab !== tabName) {
      navigation.navigate(screenName);
    }
  };

  const getTabs = () => {
    const baseTabs = [
      { name: 'home', label: 'Home', icon: Home, screen: role === 'resident' ? 'ResidentDashboard' : role === 'guard' ? 'GuardDashboard' : 'Dashboard' },
    ];

    if (role === 'resident') {
      baseTabs.push({ name: 'services', label: 'Community', icon: LayoutGrid, screen: 'ResidentCategories' }); // One step left (index 1)
    }

    baseTabs.push({ name: 'community', label: 'Social', icon: MessagesSquare, screen: 'CommunityChat' });
    baseTabs.push({ name: 'profile', label: 'Profile', icon: User, screen: role === 'resident' ? 'ResidentProfile' : 'AdminProfile' });

    return baseTabs;
  };

  const tabs = getTabs();

  return (
    <View
      className="absolute"
      style={[
        styles.container,
        Platform.OS === 'ios' ? { bottom: 32 } : { bottom: 20 }
      ]}
    >
      <View
        className="bg-[#2563EB] dark:bg-zinc-900 flex-row justify-between items-center rounded-full p-2 mx-6 border border-white/10 dark:border-zinc-800"
        style={colorScheme === 'dark' ? styles.darkShadow : styles.shadow}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handleNavigation(tab.name, tab.screen)}
              activeOpacity={0.8}
            >
              <View
                className={`items-center justify-center flex-row rounded-full ${isActive ? 'bg-white dark:bg-zinc-800 px-5 py-2' : 'px-4 py-2 bg-transparent'}`}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? (colorScheme === 'dark' ? '#2563EB' : '#2563EB') : (colorScheme === 'dark' ? '#94A3B8' : 'white')}
                />

                {isActive && (
                  <Text className="ml-2 font-satoshi-bold text-[#2563EB] dark:text-[#2563EB] text-[13px]">
                    {tab.label}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    left: 0,
    right: 0,
  },
  shadow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  darkShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  }
});

export default BottomTab;
