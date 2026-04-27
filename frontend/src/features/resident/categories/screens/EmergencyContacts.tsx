import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Shield, ShieldCheck, HeartPulse, Droplets, Zap, Flame, UserPlus, Info, Siren } from 'lucide-react-native';
import api from '../../../../utils/apiConfig';
import { useColorScheme } from 'nativewind';

const PRIMARY_COLOR = '#2563EB';

const EmergencyContacts = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [currentGuard, setCurrentGuard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentGuard();
  }, []);

  const fetchCurrentGuard = async () => {
    try {
      const response = await api.get('/api/roster/current-duty');
      setCurrentGuard(response.data);
    } catch (error) {
      console.log("Fetch current guard error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    {
      title: "Law Enforcement",
      icon: <Shield size={18} color="#2563EB" />,
      contacts: [
        { name: "Police Emergency", number: "15", description: "Direct Police Dispatch" },
        { name: "Punjab Police Complaints", number: "1787", description: "Citizen Facilitation" },
        { name: "Cyber Crime (FIA)", number: "9911", description: "Online Harassment/Threats" },
      ]
    },
    {
      title: "Medical & Rescue (24/7)",
      icon: <HeartPulse size={18} color="#E11D48" />,
      contacts: [
        { name: "Rescue 1122", number: "1122", description: "Ambulance & Fire Service" },
        { name: "Edhi Ambulance", number: "115", description: "Largest Ambulance Network" },
        { name: "Punjab Cardiology", number: "042-99203051", description: "PIC Specialized Emergency" },
        { name: "Mayo Hospital", number: "042-99211100", description: "General/Trauma Center" },
      ]
    },
    {
      title: "Public Utilities",
      icon: < Zap size={18} color="#EAB308" />,
      contacts: [
        { name: "Electricity (WAPDA)", number: "118", description: "Short Circuit / Breakdown" },
        { name: "Sui Gas Complaints", number: "119", description: "Gas Leakage / Pressure" },
        { name: "Water/Sanitation", number: "139", description: "WASA Supply Issues" },
      ]
    }
  ];

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA] dark:bg-zinc-950">
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center mr-4"
        >
          <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
        </TouchableOpacity>
        <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Resident Helpline</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Dynamic Guard on Duty */}
        <View className="mb-8">
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg mb-2">Society Security</Text>
          {isLoading ? (
            <ActivityIndicator color={PRIMARY_COLOR} />
          ) : currentGuard ? (
            <TouchableOpacity
              onPress={() => handleCall(currentGuard.staff?.phone)}
              activeOpacity={0.9}
              className="bg-blue-600 rounded-[32px] p-6 shadow-lg shadow-blue-500/30 overflow-hidden relative"
            >
              <View className="flex-row items-center">
                <View className="w-16 h-16 bg-white/20 rounded-3xl items-center justify-center border border-white/20">
                  <ShieldCheck size={32} color="white" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-blue-100 text-[10px] font-satoshi-black uppercase tracking-[2px]">Guard on Duty</Text>
                  <Text className="text-white font-satoshi-black text-2xl mt-0.5">{currentGuard.staff?.full_name || "Assigned Guard"}</Text>
                  <Text className="text-blue-100/90 font-satoshi-medium text-xs mt-1">Direct Line: {currentGuard.staff?.phone}</Text>
                </View>
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <Phone size={22} color="white" />
                </View>
              </View>
              <View className="flex-row mt-4 pt-4 border-t border-white/10 items-center">
                <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                <Text className="text-blue-50 font-satoshi-medium text-[11px]">Active Shift: {currentGuard.shift_start} ��� {currentGuard.shift_end}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-[32px] border border-orange-100 dark:border-orange-900/20 flex-row items-center">
              <Info size={24} color="#EA580C" />
              <View className="ml-4">
                <Text className="text-orange-900 dark:text-orange-400 font-satoshi-bold text-base">Security Rotation In-Progress</Text>
                <Text className="text-orange-700/70 dark:text-orange-500/70 font-satoshi-medium text-xs mt-0.5">Please contact the Main Gate Intercom.</Text>
              </View>
            </View>
          )}
        </View>

        {/* Categories */}
        {categories.map((cat, idx) => (
          <View key={idx} className="mb-8">
            <View className="flex-row items-center mb-4">
              {cat.icon}
              <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-lg ml-3">{cat.title}</Text>
            </View>

            <View className="gap-y-4">
              {cat.contacts.map((contact, cIdx) => (
                <TouchableOpacity
                  key={cIdx}
                  onPress={() => handleCall(contact.number)}
                  activeOpacity={0.7}
                  className="bg-white dark:bg-zinc-900 p-5 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm flex-row items-center"
                >
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-base">{contact.name}</Text>
                    <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-medium text-[12px] mt-0.5">{contact.description}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-blue-600 dark:text-blue-400 font-satoshi-black text-xl">{contact.number}</Text>
                    <View className="mt-1 flex-row items-center bg-gray-50 dark:bg-zinc-800/60 px-2.5 py-1 rounded-full border border-gray-100 dark:border-zinc-800">
                      <Phone size={10} color={colorScheme === 'dark' ? '#94A3B8' : "#64748B"} />
                      <Text className="text-gray-500 dark:text-zinc-400 font-satoshi-bold text-[9px] ml-1 uppercase">Instant Call</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View className="mb-12 bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-dashed border-gray-200 dark:border-zinc-800 items-center">
          <Siren size={32} color="#f00b0bff" />
          <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-base mt-3">Need Immediate Guard Assistance?</Text>
          <Text className="text-gray-500 dark:text-zinc-400 text-center text-xs font-satoshi-medium mt-1 leading-relaxed px-4">
            Use the Emergency SOS button in the Security Intercom Hub for critical security dispatch.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SecurityIntercom')}
            className="mt-4 px-6 py-3 bg-[#2563EB] rounded-full"
          >
            <Text className="text-white dark:text-gray-900 font-satoshi-black text-xs uppercase tracking-widest">Go to Intercom</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmergencyContacts;
