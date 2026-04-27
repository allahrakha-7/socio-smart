import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { ArrowLeft, Search, Ban, Volume2, Zap, Car, User, MapPin, X, Info, ShieldAlert, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY_COLOR = '#2563EB';
const SESSION_KEY = '@sociosmart/session_v1';

import { getApiBaseUrl } from '../../../utils/apiConfig';

const SearchVehicle = ({ navigation }: any) => {
  const { colorScheme } = useColorScheme();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSearch = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter a vehicle plate number');
      return;
    }

    setIsLoading(true);
    setSearchResult(null);

    try {
      const baseUrl = getApiBaseUrl();
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      if (!sessionRaw) {
        navigation.navigate('Login');
        return;
      }
      const parsed = JSON.parse(sessionRaw);

      const response = await fetch(`${baseUrl}/api/vehicles`, {
        headers: { Authorization: `Bearer ${parsed.token}` },
      });
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        // Clean the search input
        const searchInput = vehicleNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        const found = data.find((v: any) => {
          if (!v.vehicle_number) return false;
          const dbPlate = v.vehicle_number.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          return dbPlate === searchInput;
        });

        if (found) {
          try { Vibration.vibrate(50); } catch (e) { console.log('Vibrate permission required - please rebuild app.'); }
          setSearchResult(found);
          setIsModalVisible(true);
        } else {
          try { Vibration.vibrate([0, 80, 50, 80]); } catch (e) { }
          Alert.alert(
            'Vehicle Not Found',
            `No record found for "${vehicleNumber.toUpperCase()}". \n\nPlease verify the plate number or ensure the resident has completed their registration in the "My Vehicles" section.`
          );
        }
      } else {
        const errorMsg = data && data.message ? data.message : 'Database synchronization failed.';
        Alert.alert('Registry Error', errorMsg);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const IncidentCard = ({ icon: Icon, title, description, color }: any) => (
    <View className="flex-row items-center mb-6 px-2">
      <View className="relative">
        {/* Background Decorative Shape */}
        <View
          className="absolute -top-1 -left-1 w-16 h-16 rounded-2xl rotate-12 opacity-20"
          style={{ backgroundColor: color }}
        />
        <View className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 items-center justify-center shadow-sm">
          <Icon size={30} color={color} strokeWidth={2.5} />
        </View>
      </View>
      <View className="flex-1 ml-5">
        <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[17px]">{title}</Text>
        <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-[12px] mt-1 leading-snug">
          {description}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colorScheme === 'dark' ? '#09090b' : "#FFFFFF"} />

        {/* Header */}
        <View className="flex-row items-center px-6 py-5 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color={colorScheme === 'dark' ? '#F4F4F5' : '#64748B'} />
          </TouchableOpacity>
          <Text className="text-[20px] font-satoshi-bold text-gray-900 dark:text-zinc-50">Search Vehicle</Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Bar Block */}
          <View className="mb-10 items-center">
            <View className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full px-6 py-1 shadow-sm mb-6">
              <TextInput
                placeholder="Enter Vehicle Number"
                placeholderTextColor={colorScheme === 'dark' ? '#52525B' : "#94A3B8"}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                className="h-12 text-left px-2 text-lg font-satoshi-medium text-gray-900 dark:text-zinc-50"
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity
              onPress={handleSearch}
              disabled={isLoading}
              activeOpacity={0.8}
              className="w-full h-14 bg-[#2563EB] rounded-full items-center justify-center shadow-lg shadow-blue-500/30"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-satoshi-bold text-lg">Search</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="items-center mb-10">
            <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-2xl">Vehicle Search</Text>
            <Text className="text-gray-400 dark:text-zinc-500 font-satoshi-medium text-center mt-2 px-6">
              Here are some common incident and problems that can occur due to vehicles
            </Text>
          </View>

          {/* Static Incident Cards */}
          <IncidentCard
            icon={Ban}
            title="Illegal Parking"
            description="Parking in no parking zones, blocking driveways, fire hydrants, or crosswalks."
            color="#A855F7"
          />
          <IncidentCard
            icon={Volume2}
            title="Noise Disturbances"
            description="Loud music or exhaust noise causing disturbances to neighbors."
            color="#F43F5E"
          />
          <IncidentCard
            icon={Zap}
            title="Reckless Driving"
            description="Aggressive driving behavior (e.g., tailgating, road rage)"
            color="#3B82F6"
          />

        </ScrollView>
      </SafeAreaView>

      {/* Vehicle Details Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-zinc-900 w-full rounded-[32px] p-6 shadow-2xl relative">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1 items-center ml-8">
                <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-black text-xl">Vehicle Details</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="p-1"
              >
                <X size={24} color={colorScheme === 'dark' ? '#F4F4F5' : '#111827'} />
              </TouchableOpacity>
            </View>

            {/* Search Meta */}
            <View className="items-center mb-6">
              <Text className="text-gray-500 font-satoshi-bold text-sm">
                Search result for :- <Text className="text-[#EF4444]">{searchResult?.vehicle_number}</Text>
              </Text>
            </View>

            <View className="flex-row">
              {/* Left: Images Column */}
              <View className="w-24 gap-y-3">
                <View className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                  {searchResult?.owner?.profile_image ? (
                    <Image source={{ uri: searchResult.owner.profile_image }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="flex-1 items-center justify-center"><User size={30} color="#CBD5E1" /></View>
                  )}
                </View>
                <View className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                  {searchResult?.vehicle_image ? (
                    <Image source={{ uri: searchResult.vehicle_image }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="flex-1 items-center justify-center"><Car size={30} color="#CBD5E1" /></View>
                  )}
                </View>
              </View>

              {/* Right: Details Column */}
              <View className="flex-1 ml-6 gap-y-4">
                <View>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[13px]">Belongs to :- <Text className="text-[#EF4444]">{searchResult?.owner?.full_name}</Text></Text>
                </View>
                <View>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[13px]">Flat No :- <Text className="text-[#EF4444]">{searchResult?.owner?.house_number}</Text></Text>
                </View>
                <View>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[13px]">Type :- <Text className="text-[#EF4444]">Resident {searchResult?.vehicle_type}</Text></Text>
                </View>
                <View>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[13px]">Vehicle :- <Text className="text-[#EF4444]">{searchResult?.make_model}, {searchResult?.color}</Text></Text>
                </View>
                <View>
                  <Text className="text-gray-900 dark:text-zinc-50 font-satoshi-bold text-[13px]">Assigned parking slot :- <Text className="text-[#EF4444]">{searchResult?.parking_slot}</Text></Text>
                </View>
                {searchResult?.status === 'blacklisted' && (
                  <View className="flex-row items-center border border-red-200 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-2xl mt-2">
                    <ShieldAlert size={14} color="#EF4444" />
                    <Text className="ml-2 text-red-700 dark:text-red-400 text-[10px] font-satoshi-black uppercase tracking-wider">
                      BLACKLISTED VEHICLE
                    </Text>
                  </View>
                )}
                {searchResult?.approval_status === 'approved' && searchResult?.status === 'active' && (
                  <View className="flex-row items-center border border-emerald-100 bg-emerald-50 dark:bg-emerald-900/10 p-2.5 rounded-2xl mt-1">
                    <CheckCircle size={14} color="#059669" />
                    <Text className="ml-2 text-emerald-700 dark:text-emerald-400 text-[10px] font-satoshi-bold uppercase tracking-wider">
                      Verified Resident
                    </Text>
                  </View>
                )}
                {searchResult?.approval_status !== 'approved' && (
                  <View className={`flex-row items-center border p-2.5 rounded-2xl mt-2 ${searchResult?.approval_status === 'rejected' ? 'border-rose-100 bg-rose-50 dark:bg-rose-900/10' : 'border-amber-100 bg-amber-50 dark:bg-amber-900/10'}`}>
                    <Info size={14} color={searchResult?.approval_status === 'rejected' ? '#E11D48' : '#D97706'} />
                    <Text className={`ml-2 text-[10px] font-satoshi-bold uppercase tracking-wider ${searchResult?.approval_status === 'rejected' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {searchResult?.approval_status} Registration
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="mt-8 bg-[#EF4444] py-3.5 rounded-2xl items-center shadow-lg shadow-red-500/20"
            >
              <Text className="text-white font-satoshi-black uppercase tracking-widest text-sm">Close Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SearchVehicle;
